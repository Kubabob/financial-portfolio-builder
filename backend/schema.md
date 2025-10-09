# Schema of backend

## Utils
- fn parse_quote_query(QuoteQuery) -> Arc\<ParsedQuoteQuery>
- fn cache_quotes(MultipleQuotes) -> None
- fn combine_dataframes(ParsedQuoteQuery) -> Dataframe
- fn missing_values(Dataframe) -> Dataframe
- fn missing_values_count(Dataframe) -> Dataframe
- fn missing_values_percent(Dataframe) -> Dataframe

## Core (prev. Services)
- fn fetchQuotes(ParsedQuoteQuery) -> Dataframe

## Routes
- /api/v1
    - /quotes?start=&end=&tickers=&columns=
    - /quotes/missing_values?start=&end=&tickers=&columns=
    - /quotes/missing_values/count?start=&end=&tickers=&columns=
    - /quotes/missing_values/percent?start=&end=&tickers=&columns=

## Cache
- lazy static QUOTES_CACHE(ParsedQuoteQuery) -> Arc\<Dataframe>

## Schemas
- struct QuoteQuery
    - start: String
    - end: String
    - tickers: String
    - columns: String
- struct ParsedQuoteQuery
    - start: Arc\<OffsetDataTime>
    - end: Arc\<OffsetDataTime>
    - tickers: Arc\<[str]>
    - columns: Arc\<[str]>
- struct MultipleQuotes
    - Arc\<[ParsedQuoteQuery]>
