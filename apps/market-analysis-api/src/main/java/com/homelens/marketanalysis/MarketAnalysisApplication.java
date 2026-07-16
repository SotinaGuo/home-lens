package com.homelens.marketanalysis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MarketAnalysisApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarketAnalysisApplication.class, args);
    }
}
