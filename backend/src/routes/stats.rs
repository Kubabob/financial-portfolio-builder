use axum::{
    Router,
    extract::{Path, Query},
    http::StatusCode,
    routing::get,
};
use shared::models::QuoteQuery;

use crate::services::{
    fetching::get_dataframe_service,
    stats::{
        missing_values_count as missing_values_count_calc, missing_values_df,
        missing_values_percentage as missing_values_percentage_calc,
    },
};

pub fn router() -> Router {
    Router::new()
        .route("/dataframes/missing_values/{ticker}", get(missing_values))
        .route(
            "/dataframes/missing_values/count/{ticker}",
            get(missing_values_count),
        )
        .route(
            "/dataframes/missing_values/percent/{ticker}",
            get(missing_values_percent),
        )
}

pub async fn missing_values(Query(props): Query<QuoteQuery>) -> (StatusCode, String) {
    let quotes = get_dataframe_service(&props)
        .await
        .expect("Failed to get quotes");

    let missing_values = missing_values_df(&quotes);

    (StatusCode::OK, missing_values.unwrap().to_string())
}

pub async fn missing_values_count(Query(props): Query<QuoteQuery>) -> (StatusCode, String) {
    let quotes = get_dataframe_service(&props)
        .await
        .expect("Failed to get quotes");

    let missing_values = missing_values_df(&quotes).unwrap();

    let missing_values_count = missing_values_count_calc(&missing_values);
    (StatusCode::OK, missing_values_count.unwrap().to_string())
}

pub async fn missing_values_percent(Query(props): Query<QuoteQuery>) -> (StatusCode, String) {
    let quotes = get_dataframe_service(&props)
        .await
        .expect("Failed to get quotes");

    let missing_values = missing_values_df(&quotes).unwrap();

    let missing_values_count = missing_values_percentage_calc(&missing_values);
    (StatusCode::OK, missing_values_count.unwrap().to_string())
}
