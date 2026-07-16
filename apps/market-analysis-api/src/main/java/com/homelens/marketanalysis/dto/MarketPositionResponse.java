package com.homelens.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MarketPositionResponse(
    double percentile,
    @JsonProperty("above_market_average") boolean aboveMarketAverage,
    @JsonProperty("difference_from_average") double differenceFromAverage
) {
}
