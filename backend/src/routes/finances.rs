use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::Json,
};
use json::JsonValue;
use polars::{frame::DataFrame, prelude::LazyFrame};
use yahoo_finance_api::Quote;

use crate::services::finances::get_quotes_polars;

use super::super::services::finances::get_quotes;
use shared::models::QuoteQuery;

pub async fn get_quotes_for_ticker_v1(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, Json<Vec<Quote>>) {
    // println!("Quotes for ticker: {:?}", &ticker);

    let quotes = get_quotes(&ticker, &props.start, &props.end)
        .await
        .expect("Failed to get quotes");

    (StatusCode::OK, Json(quotes))
}

pub async fn get_quotes_for_ticker_v2(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, String) {
    // println!("Quotes for ticker: {:?}", &ticker);

    let quotes = get_quotes_polars(&ticker, &props.start, &props.end)
        .await
        .expect("Failed to get quotes");

    println!("{:?}", quotes);
    (StatusCode::OK, quotes.to_string())
}
