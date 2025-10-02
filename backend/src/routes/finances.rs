use axum::{
    Router,
    extract::{Path, Query, State},
    http::{Error, StatusCode},
    response::Json,
    routing::get,
};
use serde::Deserialize;
use serde::Serialize;
use yahoo_finance_api::Quote;

use super::super::services::finances::get_quotes;
use shared::models::QuoteQuery;

#[derive(Serialize)]
pub struct QuoteResponse {
    timestamp: i64,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    volume: u64,
    adjclose: f64,
}

impl From<Quote> for QuoteResponse {
    fn from(quote: Quote) -> Self {
        QuoteResponse {
            timestamp: quote.timestamp,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            volume: quote.volume,
            adjclose: quote.adjclose,
        }
    }
}

pub async fn get_quotes_for_ticker(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, Json<Vec<QuoteResponse>>) {
    println!("Quotes for ticker: {:?}", &ticker);

    let quotes = get_quotes(&ticker, &props.start, &props.end)
        .await
        .expect("Failed to get quotes");

    println!("{:#?}", &quotes);

    let response: Vec<QuoteResponse> = quotes.into_iter().map(QuoteResponse::from).collect();

    (StatusCode::OK, Json(response))
}
