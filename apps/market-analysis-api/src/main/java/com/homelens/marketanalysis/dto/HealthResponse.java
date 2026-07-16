package com.homelens.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record HealthResponse(
    String status,
    String service,
    @JsonProperty("records_loaded") int recordsLoaded,
    @JsonProperty("ml_api_base_url") String mlApiBaseUrl
) {
}
