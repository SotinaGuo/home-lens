package com.homelens.marketanalysis.controller;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.service.DatasetLoader;

@WebMvcTest(HealthController.class)
@EnableConfigurationProperties(MarketAnalysisProperties.class)
@TestPropertySource(properties = {
    "market.analysis.workbook-path=../ml-api/data/House Price Dataset & Test Data For Prediction.xlsx",
    "market.analysis.ml-api-base-url=http://localhost:8000"
})
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DatasetLoader datasetLoader;

    @Test
    void returnsServiceHealth() throws Exception {
        given(datasetLoader.recordCount()).willReturn(50);

        mockMvc.perform(get("/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", equalTo("ok")))
            .andExpect(jsonPath("$.service", equalTo("market-analysis-api")))
            .andExpect(jsonPath("$.records_loaded", is(50)))
            .andExpect(jsonPath("$.ml_api_base_url", equalTo("http://localhost:8000")));
    }
}
