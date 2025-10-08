use std::error::Error;

use crate::{cache::DF_CACHE, utils::df_from_quotes};
use polars::prelude::*;
use shared::models::QuoteQuery;
use time::OffsetDateTime;
use yahoo_finance_api as yahoo;

pub async fn get_dataframe_service(
    ticker: &str,
    props: &QuoteQuery,
) -> Result<DataFrame, Box<dyn Error>> {
    // parse RFC3339 strings like "2020-01-01T00:00:00Z"
    let start = OffsetDateTime::parse(&props.start, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse start datetime");
    let end = OffsetDateTime::parse(&props.end, &time::format_description::well_known::Rfc3339)
        .expect("failed to parse end datetime");

    // Determine cache key and columns to select once
    let (cache_key, columns_filter) = match &props.columns {
        Some(cols) if cols.is_empty() => (format!("{}-{}-{}", ticker, start, end), None),
        Some(cols) => {
            let columns_vec: Vec<String> = cols
                .split(',')
                .map(|s| s.trim().to_owned())
                .filter(|s| !s.is_empty())
                .collect();
            (
                format!("{}-{}-{}-{}", ticker, start, end, cols),
                Some(columns_vec),
            )
        }
        _ => (format!("{}-{}-{}", ticker, start, end), None),
    };

    // Check cache first
    if let Some(cached) = DF_CACHE.get(&cache_key) {
        return Ok(cached);
    }

    let provider = yahoo::YahooConnector::new()?;

    // returns historic quotes with daily interval
    let resp = provider.get_quote_history(ticker, start, end).await?;
    let quotes = resp.quotes()?;

    let df = df_from_quotes(&quotes, columns_filter)?;

    DF_CACHE.insert(cache_key, df.clone());

    Ok(df)
}
