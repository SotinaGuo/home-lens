package com.homelens.marketanalysis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.homelens.marketanalysis.dto.MarketSegmentResponse;
import com.homelens.marketanalysis.dto.MarketSummaryResponse;
import com.homelens.marketanalysis.dto.PropertyFeaturesRequest;
import com.homelens.marketanalysis.dto.WhatIfResponse;
import com.homelens.marketanalysis.model.MarketFilters;
import com.homelens.marketanalysis.service.MarketAnalysisService;

import jakarta.validation.Valid;

@RestController
public class MarketController {

    private final MarketAnalysisService marketAnalysisService;

    public MarketController(MarketAnalysisService marketAnalysisService) {
        this.marketAnalysisService = marketAnalysisService;
    }

    @GetMapping("/market/summary")
    public MarketSummaryResponse summary() {
        return marketAnalysisService.summary();
    }

    @GetMapping("/market/segments")
    public MarketSegmentResponse segments(
        @RequestParam(required = false) Double minPrice,
        @RequestParam(required = false) Double maxPrice,
        @RequestParam(required = false) Integer minBedrooms,
        @RequestParam(required = false) Integer maxBedrooms,
        @RequestParam(required = false) Double minSchoolRating,
        @RequestParam(required = false) Double maxDistanceToCityCenter
    ) {
        return marketAnalysisService.segments(new MarketFilters(
            minPrice,
            maxPrice,
            minBedrooms,
            maxBedrooms,
            minSchoolRating,
            maxDistanceToCityCenter
        ));
    }

    @PostMapping("/market/what-if")
    public WhatIfResponse whatIf(@Valid @RequestBody PropertyFeaturesRequest request) {
        return marketAnalysisService.whatIf(request.toModel());
    }
}
