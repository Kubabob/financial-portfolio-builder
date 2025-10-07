use crate::calculations::missing_values_column;
use polars::frame::DataFrame;

pub fn missing_values(df: DataFrame) -> String {
    df.column_iter()
        .map(|column| missing_values_column(column))
        .collect::<DataFrame>()
        .to_string()
}
