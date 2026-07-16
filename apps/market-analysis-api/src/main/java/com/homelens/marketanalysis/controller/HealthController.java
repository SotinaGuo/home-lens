package com.homelens.marketanalysis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.dto.HealthResponse;
import com.homelens.marketanalysis.service.DatasetLoader;

@RestController
public class HealthController {

    private final MarketAnalysisProperties properties;
    private final DatasetLoader datasetLoader;

    public HealthController(MarketAnalysisProperties properties, DatasetLoader datasetLoader) {
        this.properties = properties;
        this.datasetLoader = datasetLoader;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(
            "ok",
            "market-analysis-api",
            datasetLoader.recordCount(),
            properties.mlApiBaseUrl().toString()
        );
    }
}
