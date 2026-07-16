package com.homelens.marketanalysis.controller;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.homelens.marketanalysis.dto.MarketPositionResponse;
import com.homelens.marketanalysis.dto.MarketSegmentResponse;
import com.homelens.marketanalysis.dto.MarketSummaryResponse;
import com.homelens.marketanalysis.dto.PriceBucketResponse;
import com.homelens.marketanalysis.dto.StatisticSummaryResponse;
import com.homelens.marketanalysis.dto.WhatIfResponse;
import com.homelens.marketanalysis.exception.InvalidMarketFilterException;
import com.homelens.marketanalysis.exception.MlApiUnavailableException;
import com.homelens.marketanalysis.model.MarketFilters;
import com.homelens.marketanalysis.service.MarketAnalysisService;

@WebMvcTest(MarketController.class)
class MarketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MarketAnalysisService marketAnalysisService;

    @Test
    void returnsMarketSummary() throws Exception {
        given(marketAnalysisService.summary()).willReturn(summary());

        mockMvc.perform(get("/market/summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.record_count", equalTo(2)))
            .andExpect(jsonPath("$.price.average", equalTo(225000.0)))
            .andExpect(jsonPath("$.price_buckets[0].label", equalTo("< $250k")));
    }

    @Test
    void returnsMarketSegmentsWithFilters() throws Exception {
        given(marketAnalysisService.segments(any(MarketFilters.class))).willReturn(
            new MarketSegmentResponse(new MarketFilters(null, null, 3, null, 7.0, null), 0, null, List.of())
        );

        mockMvc.perform(get("/market/segments?minBedrooms=3&minSchoolRating=7"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.record_count", equalTo(0)))
            .andExpect(jsonPath("$.statistics", nullValue()))
            .andExpect(jsonPath("$.records").isArray());
    }

    @Test
    void returnsBadRequestForInvalidFilters() throws Exception {
        given(marketAnalysisService.segments(any(MarketFilters.class)))
            .willThrow(new InvalidMarketFilterException("minPrice cannot exceed maxPrice"));

        mockMvc.perform(get("/market/segments?minPrice=400000&maxPrice=200000"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail", equalTo("minPrice cannot exceed maxPrice")));
    }

    @Test
    void returnsBadRequestForMalformedQueryParameter() throws Exception {
        mockMvc.perform(get("/market/segments?minBedrooms=abc"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail", equalTo("Invalid request parameter")));
    }

    @Test
    void returnsBadRequestForNegativeBedrooms() throws Exception {
        given(marketAnalysisService.segments(any(MarketFilters.class)))
            .willThrow(new InvalidMarketFilterException("minBedrooms cannot be negative"));

        mockMvc.perform(get("/market/segments?minBedrooms=-1"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail", equalTo("minBedrooms cannot be negative")));
    }

    @Test
    void returnsWhatIfResponse() throws Exception {
        given(marketAnalysisService.whatIf(any())).willReturn(new WhatIfResponse(
            250829.56,
            new MarketPositionResponse(46.0, false, -12450.44),
            List.of()
        ));

        mockMvc.perform(post("/market/what-if")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "square_footage": 1550,
                      "bedrooms": 3,
                      "bathrooms": 2,
                      "year_built": 1997,
                      "lot_size": 6800,
                      "distance_to_city_center": 4.1,
                      "school_rating": 7.6
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.predicted_price", equalTo(250829.56)))
            .andExpect(jsonPath("$.market_position.percentile", equalTo(46.0)));
    }

    @Test
    void mapsMlApiFailureToBadGateway() throws Exception {
        given(marketAnalysisService.whatIf(any()))
            .willThrow(new MlApiUnavailableException("Prediction service unavailable"));

        mockMvc.perform(post("/market/what-if")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "square_footage": 1550,
                      "bedrooms": 3,
                      "bathrooms": 2,
                      "year_built": 1997,
                      "lot_size": 6800,
                      "distance_to_city_center": 4.1,
                      "school_rating": 7.6
                    }
                    """))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.detail", equalTo("Prediction service unavailable")));
    }

    private MarketSummaryResponse summary() {
        return new MarketSummaryResponse(
            2,
            new StatisticSummaryResponse(225000.0, 225000.0, 185000.0, 265000.0),
            new StatisticSummaryResponse(1550.0, 1550.0, 1250.0, 1850.0),
            new StatisticSummaryResponse(2.5, 2.5, 2.0, 3.0),
            new StatisticSummaryResponse(1.5, 1.5, 1.0, 2.0),
            new StatisticSummaryResponse(7.65, 7.65, 7.1, 8.2),
            new StatisticSummaryResponse(4.4, 4.4, 3.2, 5.6),
            List.of(new PriceBucketResponse("< $250k", 1))
        );
    }
}
