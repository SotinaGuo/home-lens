package com.homelens.marketanalysis.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WhatIfResponse(
    @JsonProperty("predicted_price") double predictedPrice,
    @JsonProperty("market_position") MarketPositionResponse marketPosition,
    @JsonProperty("nearest_records") List<PropertyRecordResponse> nearestRecords
) {
}
