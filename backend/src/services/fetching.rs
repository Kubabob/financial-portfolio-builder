use std::{error::Error, time::Instant};

use crate::cache::{DF_CACHE, QUOTE_CACHE};
use polars::prelude::*;
use time::OffsetDateTime;
use yahoo_finance_api::{self as yahoo, Quote, YahooError};

pub async fn get_quotes_service(
    ticker: &str,
    start: &str,
    end: &str,
) -> Result<Vec<Quote>, YahooError> {
    // parse RFC3339 strings like "2020-01-01T00:00:00Z"
    let start = OffsetDateTime::parse(start, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse start datetime");
    let end = OffsetDateTime::parse(end, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse end datetime");

    let start_time = Instant::now();
    // Check cache first
    if let Some(cached) = QUOTE_CACHE.get(&format!("{}-{}-{}", ticker, start, end)) {
        println!("Cache hit for {}", &format!("{}-{}-{}", ticker, start, end));
        println!("Cached took: {:?}", start_time.elapsed());
        return Ok(cached);
    }

    println!(
        "Cache miss for {}, fetching from API",
        &format!("{}-{}-{}", ticker, start, end)
    );

    let provider = yahoo::YahooConnector::new().unwrap();

    // returns historic quotes with daily interval
    let resp = provider
        .get_quote_history(ticker, start, end)
        .await
        .unwrap();
    let quotes = resp.quotes()?;

    QUOTE_CACHE.insert(format!("{}-{}-{}", ticker, start, end), quotes.clone());

    println!("Not cached took: {:?}", start_time.elapsed());
    Ok(quotes)
}

pub async fn get_quotes_polars(
    ticker: &str,
    start: &str,
    end: &str,
) -> Result<DataFrame, Box<dyn Error>> {
    // parse RFC3339 strings like "2020-01-01T00:00:00Z"
    let start = OffsetDateTime::parse(start, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse start datetime");
    let end = OffsetDateTime::parse(end, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse end datetime");

    // Check cache first
    if let Some(cached) = DF_CACHE.get(&format!("{}-{}-{}", ticker, start, end)) {
        // if let Some(cached) = DF_CACHE.get(ticker) {
        println!("Cache hit for {}", &format!("{}-{}-{}", ticker, start, end));
        return Ok(cached);
    }

    println!(
        "Cache miss for {}, fetching from API",
        &format!("{}-{}-{}", ticker, start, end)
    );

    let provider = yahoo::YahooConnector::new().unwrap();

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

    DF_CACHE.insert(format!("{}-{}-{}", ticker, start, end), df.clone());
    // DF_CACHE.insert(ticker.to_string(), df.clone());

    Ok(df)
}
