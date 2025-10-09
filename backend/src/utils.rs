use polars::df;
use polars::error::PolarsError;
use polars::frame::DataFrame;
use polars::functions::concat_df_horizontal;
use polars::prelude::{
    Column, DataFrameJoinOps, DataType, IntoColumn, JoinArgs, JoinType, TimeUnit,
};
use polars::{prelude::NamedFrom, series::Series};
use time::Duration;
use time::OffsetDateTime;
use time::parsing::Parsable;
use yahoo_finance_api::{Quote, YahooConnector};

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

pub async fn get_quotes_history(
    provider: YahooConnector,
    tickers: Vec<String>,
    start: OffsetDateTime,
    end: OffsetDateTime,
    columns: Option<Vec<String>>,
) -> Result<Vec<DataFrame>, Box<dyn std::error::Error>> {
    // Call the async method sequentially for each ticker and propagate errors.
    let mut responses = Vec::with_capacity(tickers.len());
    for ticker in tickers.iter() {
        let resp = provider.get_quote_history(ticker, start, end).await?;
        responses.push(resp);
    }

    let mut dataframes = Vec::with_capacity(responses.len());
    for response in responses {
        let quotes = response.quotes()?;
        dataframes.push(df_from_quotes(&quotes, columns.clone())?);
    }

    Ok(dataframes)
}

pub fn combine_dfs(
    dataframes: Vec<DataFrame>,
    tickers: Vec<String>,
) -> Result<DataFrame, PolarsError> {
    if dataframes.is_empty() {
        return Err(PolarsError::NoData("No dataframes to combine".into()));
    }

    let mut renamed_dfs = Vec::with_capacity(dataframes.len());

    for (df, ticker) in dataframes.into_iter().zip(tickers.iter()) {
        let mut renamed_df = df.clone();
        for col in df.get_column_names() {
            // Rename all columns including date with ticker prefix
            renamed_df.rename(col, format!("{} {}", ticker, col).into())?;
        }
        renamed_dfs.push(renamed_df);
    }

    // Start with the first dataframe
    let mut combined_df = renamed_dfs[0].clone();
    let first_ticker = &tickers[0];

    // Join all subsequent dataframes on their respective date columns
    for (i, df) in renamed_dfs.iter().enumerate().skip(1) {
        let ticker = &tickers[i];
        combined_df = combined_df.join(
            df,
            &[format!("{} date", first_ticker)],
            &[format!("{} date", ticker)],
            JoinArgs::new(JoinType::Full),
            None,
        )?;
    }

    Ok(combined_df)
}

pub fn df_from_quotes(
    quotes: &Vec<Quote>,
    columns: Option<Vec<String>>,
) -> Result<DataFrame, PolarsError> {
    if let Some(columns) = columns {
        let mut cols_series: Vec<Column> = Vec::with_capacity(columns.len());
        for col_name in columns.iter() {
            match col_name.as_str() {
                "date" => {
                    // Convert Unix timestamp to datetime
                    let timestamps: Vec<i64> = quotes.iter().map(|q| q.timestamp as i64).collect();

                    let date_series = Series::new("date".into(), timestamps)
                        .cast(&DataType::Datetime(TimeUnit::Milliseconds, None))?;

                    cols_series.push(date_series.into_column());
                }
                "open" => cols_series.push(
                    Series::new(
                        "open".into(),
                        quotes.iter().map(|q| q.open).collect::<Vec<_>>(),
                    )
                    .into_column(),
                ),
                "high" => cols_series.push(
                    Series::new(
                        "high".into(),
                        quotes.iter().map(|q| q.high).collect::<Vec<_>>(),
                    )
                    .into_column(),
                ),
                "low" => cols_series.push(
                    Series::new(
                        "low".into(),
                        quotes.iter().map(|q| q.low).collect::<Vec<_>>(),
                    )
                    .into_column(),
                ),
                "close" => cols_series.push(
                    Series::new(
                        "close".into(),
                        quotes.iter().map(|q| q.close).collect::<Vec<_>>(),
                    )
                    .into_column(),
                ),
                "volume" => cols_series.push(
                    Series::new(
                        "volume".into(),
                        quotes.iter().map(|q| q.volume).collect::<Vec<_>>(),
                    )
                    .into_column(),
                ),
                "adjclose" => cols_series.push(
                    Series::new(
                        "adjclose".into(),
                        quotes.iter().map(|q| q.adjclose).collect::<Vec<_>>(),
                    )
                    .into_column(),
                ),
                _ => {
                    // Unknown column name: ignore it.
                }
            }
        }
        return DataFrame::new(cols_series);
    }

    // Convert timestamps to datetime for the default case
    let timestamps: Vec<i64> = quotes.iter().map(|q| q.timestamp as i64).collect();

    let date_series = Series::new("date".into(), timestamps)
        .cast(&DataType::Datetime(TimeUnit::Milliseconds, None))?;

    df![
        "date" => date_series,
        "open" => quotes.iter().map(|q| q.open).collect::<Vec<_>>(),
        "high" => quotes.iter().map(|q| q.high).collect::<Vec<_>>(),
        "low" => quotes.iter().map(|q| q.low).collect::<Vec<_>>(),
        "close" => quotes.iter().map(|q| q.close).collect::<Vec<_>>(),
        "volume" => quotes.iter().map(|q| q.volume).collect::<Vec<_>>(),
        "adjclose" => quotes.iter().map(|q| q.adjclose).collect::<Vec<_>>(),
    ]
}
