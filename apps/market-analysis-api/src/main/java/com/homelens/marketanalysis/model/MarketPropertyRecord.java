package com.homelens.marketanalysis.model;

public record MarketPropertyRecord(
    int id,
    PropertyFeatures features,
    double price
) {
}
