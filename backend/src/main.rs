mod routes;
mod services;

use axum::{
    Json, Router,
    http::{Method, StatusCode, header},
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};

use tracing_subscriber;

use routes::finances::get_quotes_for_ticker;

#[tokio::main]
async fn main() {
    // initialize tracing
    tracing_subscriber::fmt::init();

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);

    // build our application with a route
    let app = Router::new()
        // `GET /` goes to `root`
        .without_v07_checks()
        .route("/", get(root))
        .route("/finances/{ticker}", get(get_quotes_for_ticker))
        .layer(cors);
    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// basic handler that responds with a static string
async fn root() -> &'static str {
    "Hello, World!"
}
