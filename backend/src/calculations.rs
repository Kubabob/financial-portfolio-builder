use polars::prelude::*;

pub fn normalize_column_by_first(column: &Series) -> PolarsResult<Series> {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn _test_normalize_column_by_first() {
        let test_series = Series::new("test series".into(), [1, 2, 3]);
        assert!(
            normalize_column_by_first(&test_series).unwrap()
                == Series::new("Normalized test series".into(), [100, 200, 300])
        )
    }
}
