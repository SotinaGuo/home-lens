package com.homelens.marketanalysis.model;

public record PropertyFeatures(
    int squareFootage,
    int bedrooms,
    double bathrooms,
    int yearBuilt,
    int lotSize,
    double distanceToCityCenter,
    double schoolRating
) {
}
