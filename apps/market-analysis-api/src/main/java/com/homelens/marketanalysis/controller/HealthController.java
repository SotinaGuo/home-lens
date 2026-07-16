package com.homelens.marketanalysis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.dto.HealthResponse;

@RestController
public class HealthController {

    private final MarketAnalysisProperties properties;

    public HealthController(MarketAnalysisProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(
            "ok",
            "market-analysis-api",
            0,
            properties.mlApiBaseUrl().toString()
        );
    }
}
