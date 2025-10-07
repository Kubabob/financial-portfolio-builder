use crate::calculations::check_missing_values;
use polars::frame::DataFrame;

pub fn missing_values(df: DataFrame) -> String {
    // let column_names = &df.get_column_names();
    // for name in column_names {
    // df.column_iter().map(|column| check_missing_values(column))
    // }
    let df: DataFrame = df
        .column_iter()
        .map(|column| check_missing_values(column))
        .collect();

    df.to_string()
}
