use polars::{prelude::NamedFrom, series::Series};
use time::OffsetDateTime;
use time::parsing::Parsable;

pub fn generate_business_days<T>(start: &str, end: &str, format: &impl Parsable) -> Series {
    use time::Duration;
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
    Series::new("Business days".into(), days_ts)
}
