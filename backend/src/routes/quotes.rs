use axum::{
    Router,
    extract::{Path, Query},
    http::StatusCode,
    response::Json,
    routing::get,
};
use yahoo_finance_api::Quote;

use crate::services::fetching::get_dataframe_service;

use super::super::services::fetching::get_quotes_service;
use shared::models::QuoteQuery;

pub fn router() -> Router {
    Router::new()
        .route("/quotes/{ticker}", get(get_quotes))
        .route("/dataframes/{ticker}", get(get_dataframe))
}

pub async fn get_quotes(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, Json<Vec<Quote>>) {
    let quotes = get_quotes_service(&ticker, &props.start, &props.end)
        .await
        .expect("Failed to get quotes");

    (StatusCode::OK, Json(quotes))
}

pub async fn get_dataframe(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, String) {
    let quotes = get_dataframe_service(&ticker, &props)
        .await
        .expect("Failed to get quotes");

    (StatusCode::OK, quotes.to_string())
}
