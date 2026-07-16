package com.homelens.marketanalysis.dto;

public record StatisticSummaryResponse(
    double average,
    double median,
    double minimum,
    double maximum
) {
}
