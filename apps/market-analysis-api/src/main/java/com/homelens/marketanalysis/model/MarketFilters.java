package com.homelens.marketanalysis.model;

public record MarketFilters(
    Double minPrice,
    Double maxPrice,
    Integer minBedrooms,
    Integer maxBedrooms,
    Double minSchoolRating,
    Double maxDistanceToCityCenter
) {
}
