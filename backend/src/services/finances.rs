use std::error::Error;

// use axum::Json;
// use json::JsonValue;
use polars::prelude::*;
// use shared::models::Candle;
use time::OffsetDateTime;
use yahoo_finance_api::{self as yahoo, Quote, YahooError};

pub async fn get_quotes(ticker: &str, start: &str, end: &str) -> Result<Vec<Quote>, YahooError> {
    let provider = yahoo::YahooConnector::new().unwrap();
    // parse RFC3339 strings like "2020-01-01T00:00:00Z"
    let start = OffsetDateTime::parse(start, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse start datetime");
    let end = OffsetDateTime::parse(end, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse end datetime");
    // returns historic quotes with daily interval
    let resp = provider
        .get_quote_history(ticker, start, end)
        .await
        .unwrap();
    let quotes = resp.quotes().expect("Failed to retrieve quotes");
    Ok(quotes)
}

pub async fn get_quotes_polars(
    ticker: &str,
    start: &str,
    end: &str,
) -> Result<DataFrame, Box<dyn Error>> {
    let provider = yahoo::YahooConnector::new().unwrap();
    // parse RFC3339 strings like "2020-01-01T00:00:00Z"
    let start = OffsetDateTime::parse(start, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse start datetime");
    let end = OffsetDateTime::parse(end, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse end datetime");
    // returns historic quotes with daily interval
    let resp = provider
        .get_quote_history(ticker, start, end)
        .await
        .unwrap();

    let quotes = resp.quotes()?;

    let dates: Vec<i64> = quotes.iter().map(|q| q.timestamp).collect();

    let df = df![
        "date" => dates,
        "open" => quotes.iter().map(|q| q.open).collect::<Vec<_>>(),
        "high" => quotes.iter().map(|q| q.high).collect::<Vec<_>>(),
        "low" => quotes.iter().map(|q| q.low).collect::<Vec<_>>(),
        "close" => quotes.iter().map(|q| q.close).collect::<Vec<_>>(),
        "volume" => quotes.iter().map(|q| q.volume).collect::<Vec<_>>(),
        "adjclose" => quotes.iter().map(|q| q.adjclose).collect::<Vec<_>>(),
    ]?;
    Ok(df)
}
