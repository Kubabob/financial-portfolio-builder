use lazy_static::lazy_static;
use moka::sync::Cache;
use polars::prelude::*;
use std::time::Duration;
use yahoo_finance_api::Quote;

lazy_static! {
    pub static ref QUOTE_CACHE: Cache<String, Vec<Quote>> = Cache::builder()
        .time_to_live(Duration::from_mins(5))
        .max_capacity(10)
        .build();
}

lazy_static! {
    pub static ref DF_CACHE: Cache<String, DataFrame> = Cache::builder()
        .time_to_live(Duration::from_mins(5))
        .max_capacity(10)
        .build();
}
