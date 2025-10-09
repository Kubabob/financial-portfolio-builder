use axum::{
    Router,
    extract::{Path, Query},
    http::StatusCode,
    routing::get,
};

use crate::services::fetching::get_dataframe_service;

use shared::models::QuoteQuery;

pub fn router() -> Router {
    Router::new().route("/dataframes", get(get_dataframe))
}

pub async fn get_dataframe(Query(props): Query<QuoteQuery>) -> (StatusCode, String) {
    let quotes = get_dataframe_service(&props)
        .await
        .expect("Failed to get quotes");

    (StatusCode::OK, quotes.to_string())
}
