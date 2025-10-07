use polars::prelude::*;

pub fn normalize_column_by_first(column: Series) -> PolarsResult<Series> {
    Ok(column.clone().with_name(PlSmallStr::from_string(format!(
        "Normalized {}",
        column.name()
    ))) / column
        .get(0)
        .expect("Empty series")
        .try_extract::<f64>()
        .expect("Could not extract to f64")
        * 100)
}

fn missing_count(series: &Series) -> u32 {
    series
        .cast(&DataType::UInt32)
        .unwrap()
        .u32()
        .unwrap()
        .sum()
        .unwrap_or(0)
}

fn missing_count_as_series(series: &Series) -> Series {
    Series::new(
        format!("Missing count {:?}", series.name().clone()).into(),
        [series
            .cast(&DataType::UInt32)
            .unwrap()
            .u32()
            .unwrap()
            .sum()
            .unwrap()],
    )
}

fn missing_percentage(series: &Series) -> f64 {
    let missing_count = missing_count(series) as f64;

    let total = series.len() as f64;
    if total == 0.0 {
        0.0
    } else {
        missing_count / total
    }
}

// pub fn check_missing_values(column: Series) -> (Option<Series>, f64) {
//     if column.iter().any(|val| val.is_nan()) {
//         let missing_values = column.iter().map(|val| val.is_nan()).collect::<Series>();
//         return (
//             Some(missing_values.clone()),
//             missing_percentage(missing_values),
//         );
//     }
//     (None, 0.)
// }

pub fn missing_values_column(column: &Column) -> Column {
    let missing_values = column
        .as_series()
        .unwrap()
        .iter()
        .map(|val| val.is_nan())
        .collect::<Series>();

    missing_values.into_column()
}

pub fn missing_values_df(df: &DataFrame) -> DataFrame {
    df.iter()
        .map(|series| series.is_nan().unwrap().into_series())
        .collect::<DataFrame>()
}

pub fn missing_values_count(df: &DataFrame) -> DataFrame {
    df.iter()
        .map(|series| missing_count_as_series(series))
        .collect()
}

// pub fn date_completness(column: Series, start: &OffsetDateTime, end: &OffsetDateTime) -> f64 {

// }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_column_by_first() {
        let test_series = Series::new("test series".into(), [1, 2, 3]);
        assert!(
            normalize_column_by_first(test_series).unwrap()
                == Series::new("Normalized test series".into(), [100, 200, 300])
        )
    }
}
