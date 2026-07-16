package com.homelens.marketanalysis.config;

import java.net.URI;
import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "market.analysis")
public record MarketAnalysisProperties(Path workbookPath, URI mlApiBaseUrl) {
}
