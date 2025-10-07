mod cache;
mod calculations;
mod routes;
mod services;
mod utils;

use axum::{Router, routing::get};

use http::Method;
use tower_http::cors::{Any, CorsLayer};

use tracing_subscriber;

use routes::quotes::{get_quotes, get_quotes_df};

use crate::routes::stats::{missing_values, missing_values_count};

#[tokio::main]
async fn main() {
    // initialize tracing
    tracing_subscriber::fmt::init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);

    // build our application with a route
    let app = Router::new()
        // `GET /` goes to `root`
        .without_v07_checks()
        .route("/", get(root))
        .route("/api/finances/quotes/{ticker}", get(get_quotes))
        .route("/api/finances/dataframes/{ticker}", get(get_quotes_df))
        .route(
            "/api/finances/dataframes/missing_values/{ticker}",
            get(missing_values),
        )
        .route(
            "/api/finances/dataframes/missing_values/count/{ticker}",
            get(missing_values_count),
        )
        .layer(cors);
    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// basic handler that responds with a static string
async fn root() -> &'static str {
    "Hello, World!"
}
