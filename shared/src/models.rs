use serde::{Deserialize, Serialize};
use ts_rs::TS;
use yahoo_finance_api::Quote;

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct QuoteQuery {
    pub start: String,
    pub end: String,
}

/// Struct for single quote(candle)
#[derive(Debug, Clone, PartialEq, PartialOrd, Deserialize, Serialize, TS)]
#[ts(export)]
pub struct Candle {
    pub timestamp: i64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub volume: u64,
    pub close: f64,
    pub adjclose: f64,
}

impl From<&Quote> for Candle {
    fn from(value: &Quote) -> Self {
        Candle {
            timestamp: value.timestamp,
            open: value.open,
            high: value.high,
            low: value.low,
            volume: value.volume,
            close: value.close,
            adjclose: value.adjclose,
        }
    }
}
