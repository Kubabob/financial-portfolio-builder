use serde::Deserialize;
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct QuoteQuery {
    start: String,
    end: String,
}
