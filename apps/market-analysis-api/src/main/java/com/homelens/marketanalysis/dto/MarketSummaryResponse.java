package com.homelens.marketanalysis.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MarketSummaryResponse(
    @JsonProperty("record_count") int recordCount,
    StatisticSummaryResponse price,
    @JsonProperty("square_footage") StatisticSummaryResponse squareFootage,
    StatisticSummaryResponse bedrooms,
    StatisticSummaryResponse bathrooms,
    @JsonProperty("school_rating") StatisticSummaryResponse schoolRating,
    @JsonProperty("distance_to_city_center") StatisticSummaryResponse distanceToCityCenter,
    @JsonProperty("price_buckets") List<PriceBucketResponse> priceBuckets
) {
}
