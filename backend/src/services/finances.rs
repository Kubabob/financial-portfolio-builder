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
