use json::JsonValue::Null;
use polars::prelude::*;
use time::OffsetDateTime;

pub fn normalize_column_by_first(column: Series) -> PolarsResult<Series> {
    Ok(&column
        / column
            .get(0)
            .expect("Empty series")
            .try_extract::<f64>()
            .expect("Could not extract to f64")
        * 100)
}

pub fn missing_percentage(column: Series) -> f64 {
    let missing_count = column
        .cast(&DataType::UInt32)
        .unwrap()
        .u32()
        .unwrap()
        .sum()
        .unwrap_or(0) as f64;

    let total = column.len() as f64;
    if total == 0.0 {
        0.0
    } else {
        missing_count / total
    }
}

pub fn check_missing_values(column: Series) -> (Option<Series>, f64) {
    if column.iter().any(|val| val.is_nan()) {
        let missing_values = column.iter().map(|val| val.is_nan()).collect::<Series>();
        return (
            Some(missing_values.clone()),
            missing_percentage(missing_values),
        );
    }
    (None, 0.)
}

// pub fn date_completness(column: Series, start: &OffsetDateTime, end: &OffsetDateTime) -> f64 {

// }
