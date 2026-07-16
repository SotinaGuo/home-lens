package com.homelens.marketanalysis.config;

import java.net.URI;
import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "market.analysis")
public class MarketAnalysisProperties {

    private String workbookPath;
    private URI mlApiBaseUrl;

    public Path workbookPath() {
        return Path.of(workbookPath);
    }

    public URI mlApiBaseUrl() {
        return mlApiBaseUrl;
    }

    public void setWorkbookPath(String workbookPath) {
        this.workbookPath = workbookPath;
    }

    public void setMlApiBaseUrl(URI mlApiBaseUrl) {
        this.mlApiBaseUrl = mlApiBaseUrl;
    }
}
