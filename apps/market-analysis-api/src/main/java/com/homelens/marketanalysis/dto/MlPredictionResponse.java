package com.homelens.marketanalysis.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MlPredictionResponse(
    int count,
    List<PredictionItem> predictions
) {
    public record PredictionItem(@JsonProperty("predicted_price") double predictedPrice) {
    }
}
