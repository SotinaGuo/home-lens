package com.homelens.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.homelens.marketanalysis.model.MarketPropertyRecord;

public record PropertyRecordResponse(
    int id,
    @JsonProperty("square_footage") int squareFootage,
    int bedrooms,
    double bathrooms,
    @JsonProperty("year_built") int yearBuilt,
    @JsonProperty("lot_size") int lotSize,
    @JsonProperty("distance_to_city_center") double distanceToCityCenter,
    @JsonProperty("school_rating") double schoolRating,
    double price
) {
    public static PropertyRecordResponse from(MarketPropertyRecord record) {
        var features = record.features();
        return new PropertyRecordResponse(
            record.id(),
            features.squareFootage(),
            features.bedrooms(),
            features.bathrooms(),
            features.yearBuilt(),
            features.lotSize(),
            features.distanceToCityCenter(),
            features.schoolRating(),
            record.price()
        );
    }
}
