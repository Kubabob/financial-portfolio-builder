use polars::df;
use polars::error::PolarsError;
use polars::frame::DataFrame;
use polars::{prelude::NamedFrom, series::Series};
use time::Duration;
use time::OffsetDateTime;
use time::parsing::Parsable;
use yahoo_finance_api::Quote;

pub fn generate_business_days<T>(
    start: &str,
    end: &str,
    format: &impl Parsable,
) -> Result<Series, PolarsError> {
    let start_dt = OffsetDateTime::parse(start, format).unwrap();
    let end_dt = OffsetDateTime::parse(end, format).unwrap();
    let mut days_ts: Vec<i64> = Vec::new();
    let mut current = start_dt;
    while current <= end_dt {
        let wd = current.weekday();
        if wd != time::Weekday::Saturday && wd != time::Weekday::Sunday {
            let ms = current.unix_timestamp() * 1000 + (current.nanosecond() as i64 / 1_000_000);
            days_ts.push(ms);
        }
        current = current + Duration::days(1);
    }
    Ok(Series::new("Business days".into(), days_ts))
}

pub fn df_from_quotes(quotes: &Vec<Quote>) -> Result<DataFrame, PolarsError> {
    df![
        "date" => quotes.iter().map(|q| q.timestamp).collect::<Vec<_>>(),
        "open" => quotes.iter().map(|q| q.open).collect::<Vec<_>>(),
        "high" => quotes.iter().map(|q| q.high).collect::<Vec<_>>(),
        "low" => quotes.iter().map(|q| q.low).collect::<Vec<_>>(),
        "close" => quotes.iter().map(|q| q.close).collect::<Vec<_>>(),
        "volume" => quotes.iter().map(|q| q.volume).collect::<Vec<_>>(),
        "adjclose" => quotes.iter().map(|q| q.adjclose).collect::<Vec<_>>(),
    ]
}
