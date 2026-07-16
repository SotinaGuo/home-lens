package com.homelens.marketanalysis.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.homelens.marketanalysis.model.MarketFilters;

public record MarketSegmentResponse(
    MarketFilters filters,
    @JsonProperty("record_count") int recordCount,
    MarketSummaryResponse statistics,
    List<PropertyRecordResponse> records
) {
}
