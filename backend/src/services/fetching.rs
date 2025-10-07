use std::{error::Error, time::Instant};

use crate::{
    cache::{DF_CACHE, QUOTE_CACHE},
    utils::df_from_quotes,
};
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

    // Check cache first
    if let Some(cached) = QUOTE_CACHE.get(&format!("{}-{}-{}", ticker, start, end)) {
        return Ok(cached);
    }

    let provider = yahoo::YahooConnector::new()?;

    // returns historic quotes with daily interval
    let resp = provider.get_quote_history(ticker, start, end).await?;
    let quotes = resp.quotes()?;

    QUOTE_CACHE.insert(format!("{}-{}-{}", ticker, start, end), quotes.clone());

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
        return Ok(cached);
    }

    let provider = yahoo::YahooConnector::new()?;

    // returns historic quotes with daily interval
    let resp = provider.get_quote_history(ticker, start, end).await?;

    let quotes = resp.quotes()?;

    let df = df_from_quotes(&quotes)?;

    DF_CACHE.insert(format!("{}-{}-{}", ticker, start, end), df.clone());

    Ok(df)
}
