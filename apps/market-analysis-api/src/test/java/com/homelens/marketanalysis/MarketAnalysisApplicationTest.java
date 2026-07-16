package com.homelens.marketanalysis;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.service.DatasetLoader;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MarketAnalysisApplicationTest {

    @Autowired
    private DatasetLoader datasetLoader;

    @Autowired
    private MarketAnalysisProperties properties;

    @Test
    void startsWithDefaultConfigurationAndLoadsMarketData() {
        assertThat(properties.workbookPath()).exists();
        assertThat(datasetLoader.recordCount()).isEqualTo(50);
    }
}
