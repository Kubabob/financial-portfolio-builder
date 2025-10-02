use serde::Deserialize;
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct QuoteQuery {
    pub start: String,
    pub end: String,
}
