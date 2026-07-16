package com.homelens.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.homelens.marketanalysis.model.PropertyFeatures;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

public record PropertyFeaturesRequest(
    @JsonProperty("square_footage") @Positive int squareFootage,
    @Min(0) int bedrooms,
    @DecimalMin("0.0") double bathrooms,
    @JsonProperty("year_built") @Min(1800) int yearBuilt,
    @JsonProperty("lot_size") @Positive int lotSize,
    @JsonProperty("distance_to_city_center") @DecimalMin("0.0") double distanceToCityCenter,
    @JsonProperty("school_rating") @DecimalMin("0.0") @DecimalMax("10.0") double schoolRating
) {
    public PropertyFeatures toModel() {
        return new PropertyFeatures(
            squareFootage,
            bedrooms,
            bathrooms,
            yearBuilt,
            lotSize,
            distanceToCityCenter,
            schoolRating
        );
    }
}
