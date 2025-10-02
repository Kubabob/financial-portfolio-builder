use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::Json,
};
use yahoo_finance_api::Quote;

use super::super::services::finances::get_quotes;
use shared::models::QuoteQuery;

pub async fn get_quotes_for_ticker(
    Path(ticker): Path<String>,
    Query(props): Query<QuoteQuery>,
) -> (StatusCode, Json<Vec<Quote>>) {
    println!("Quotes for ticker: {:?}", &ticker);

    let quotes = get_quotes(&ticker, &props.start, &props.end)
        .await
        .expect("Failed to get quotes");

    (StatusCode::OK, Json(quotes))
}
