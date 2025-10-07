use axum::{
    extract::{Path, Query},
    http::StatusCode,
};
use shared::models::QuoteQuery;

use crate::services::{
    fetching::get_quotes_polars,
    stats::{missing_values_count as missing_values_count_calc, missing_values_df},
};

pub async fn missing_values(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, String) {
    let quotes = get_quotes_polars(&ticker, &props.start, &props.end)
        .await
        .expect("Failed to get quotes");

    let missing_values = missing_values_df(&quotes);

    (StatusCode::OK, missing_values.unwrap().to_string())
}

pub async fn missing_values_count(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, String) {
    let quotes = get_quotes_polars(&ticker, &props.start, &props.end)
        .await
        .expect("Failed to get quotes");

    let missing_values = missing_values_df(&quotes).unwrap();

    let missing_values_count = missing_values_count_calc(&missing_values);
    (StatusCode::OK, missing_values_count.unwrap().to_string())
}
