use axum::{
    Router,
    extract::{Path, Query, State},
    http::{Error, StatusCode},
    response::Json,
    routing::get,
};
use serde::Deserialize;
use yahoo_finance_api::Quote;

use super::super::services::finances::get_quotes;

#[derive(Deserialize)]
pub struct QuoteQuery {
    start: String,
    end: String,
}

pub async fn get_quotes_for_ticker(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, Json<Vec<Quote>>) {
    println!("Quotes for ticker: {:?}", &ticker);

    let quotes = get_quotes(&ticker, &props.start, &props.end)
        .await
        .expect("Failed to get quotes");

    println!("{:#?}", &quotes);

    (StatusCode::OK, Json(quotes))
}
