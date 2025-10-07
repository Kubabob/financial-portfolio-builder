use polars::{
    error::{PolarsError, PolarsResult},
    frame::DataFrame,
    prelude::{ChunkAgg, Column, DataType, IntoColumn, NamedFrom},
    series::{IntoSeries, Series},
};

pub fn missing_values(df: &DataFrame) -> Result<DataFrame, PolarsError> {
    Ok(df
        .column_iter()
        .map(|column| missing_values_column(column).expect("Could not count missing values"))
        .collect::<DataFrame>())
}

pub fn missing_count(series: &Series) -> PolarsResult<u32> {
    Ok(series.cast(&DataType::UInt32)?.u32()?.sum().unwrap_or(0))
}

pub fn missing_count_as_series(series: &Series) -> PolarsResult<Series> {
    Ok(Series::new(
        format!("Missing count {:?}", series.name().clone()).into(),
        [series.cast(&DataType::UInt32)?.u32()?.sum().unwrap()],
    ))
}

pub fn missing_percentage(series: &Series) -> PolarsResult<f64> {
    let missing_count = missing_count(series)? as f64;

    let total = series.len() as f64;
    Ok(if total == 0.0 {
        0.0
    } else {
        missing_count / total
    })
}

pub fn missing_values_column(column: &Column) -> PolarsResult<Column> {
    Ok(column
        .as_series()
        .expect("Column is empty")
        .iter()
        .map(|val| val.is_nan())
        .collect::<Series>()
        .into_column())
}

pub fn missing_values_series(column: &Series) -> PolarsResult<Series> {
    Ok(column.iter().map(|val| val.is_nan()).collect())
}

pub fn missing_values_df(df: &DataFrame) -> PolarsResult<DataFrame> {
    Ok(df
        .iter()
        .map(|series| series.is_nan().unwrap().into_series())
        .collect::<DataFrame>())
}

pub fn missing_values_count(df: &DataFrame) -> PolarsResult<DataFrame> {
    Ok(df
        .iter()
        .map(|series| missing_count_as_series(series).expect("Could not count missings"))
        .collect())
}
