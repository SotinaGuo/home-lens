package com.homelens.marketanalysis.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import com.homelens.marketanalysis.exception.MlApiUnavailableException;
import com.homelens.marketanalysis.model.PropertyFeatures;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;

class MlApiClientTest {

    private MockWebServer server;

    @BeforeEach
    void startServer() throws Exception {
        server = new MockWebServer();
        server.start();
    }

    @AfterEach
    void stopServer() throws Exception {
        server.shutdown();
    }

    @Test
    void returnsPredictedPriceFromMlApi() throws Exception {
        server.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("content-type", "application/json")
            .setBody("{\"count\":1,\"predictions\":[{\"predicted_price\":250829.56}]}"));

        MlApiClient client = new MlApiClient(
            RestClient.builder(),
            URI.create(server.url("/").toString())
        );

        double predictedPrice = client.predict(features());

        assertThat(predictedPrice).isEqualTo(250829.56);
        var request = server.takeRequest();
        assertThat(request.getPath()).isEqualTo("/predict");
        assertThat(request.getMethod()).isEqualTo("POST");
        assertThat(request.getHeader("content-type")).contains("application/json");
        assertThat(request.getHeader("transfer-encoding")).isNull();
        assertThat(request.getHeader("upgrade")).isNull();
        String requestBody = request.getBody().readUtf8();
        assertThat(requestBody)
            .contains("\"square_footage\":1550")
            .contains("\"year_built\":1997")
            .contains("\"lot_size\":6800")
            .contains("\"distance_to_city_center\":4.1")
            .contains("\"school_rating\":7.6")
            .doesNotContain("squareFootage")
            .doesNotContain("yearBuilt");
    }

    @Test
    void throwsWhenMlApiReturnsError() {
        server.enqueue(new MockResponse()
            .setResponseCode(500)
            .setBody("{\"detail\":\"Prediction failed\"}"));

        MlApiClient client = new MlApiClient(
            RestClient.builder(),
            URI.create(server.url("/").toString())
        );

        assertThatThrownBy(() -> client.predict(features()))
            .isInstanceOf(MlApiUnavailableException.class)
            .hasMessageContaining("Prediction service unavailable");
    }

    @Test
    void throwsWhenMlApiDoesNotRespondBeforeTimeout() {
        server.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("content-type", "application/json")
            .setBody("{\"count\":1,\"predictions\":[{\"predicted_price\":250829.56}]}")
            .setBodyDelay(500, TimeUnit.MILLISECONDS));

        MlApiClient client = new MlApiClient(
            RestClient.builder(),
            URI.create(server.url("/").toString()),
            Duration.ofMillis(100),
            Duration.ofMillis(100)
        );

        assertThatThrownBy(() -> client.predict(features()))
            .isInstanceOf(MlApiUnavailableException.class)
            .hasMessageContaining("Prediction service unavailable");
    }

    private PropertyFeatures features() {
        return new PropertyFeatures(1550, 3, 2.0, 1997, 6800, 4.1, 7.6);
    }
}
