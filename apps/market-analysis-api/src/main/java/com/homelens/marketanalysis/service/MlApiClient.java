package com.homelens.marketanalysis.service;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.dto.MlPredictionResponse;
import com.homelens.marketanalysis.exception.MlApiUnavailableException;
import com.homelens.marketanalysis.model.PropertyFeatures;

@Component
public class MlApiClient {

    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(3);

    private final RestClient restClient;
    private final URI mlApiBaseUrl;

    @Autowired
    public MlApiClient(RestClient.Builder builder, MarketAnalysisProperties properties) {
        this(builder, properties.mlApiBaseUrl(), DEFAULT_TIMEOUT, DEFAULT_TIMEOUT);
    }

    MlApiClient(RestClient.Builder builder, URI mlApiBaseUrl) {
        this(builder, mlApiBaseUrl, DEFAULT_TIMEOUT, DEFAULT_TIMEOUT);
    }

    MlApiClient(
        RestClient.Builder builder,
        URI mlApiBaseUrl,
        Duration connectTimeout,
        Duration readTimeout
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeout);
        requestFactory.setReadTimeout(readTimeout);

        this.restClient = builder
            .baseUrl(mlApiBaseUrl.toString())
            .requestFactory(new BufferingClientHttpRequestFactory(requestFactory))
            .build();
        this.mlApiBaseUrl = mlApiBaseUrl;
    }

    public double predict(PropertyFeatures features) {
        try {
            MlPredictionResponse response = restClient.post()
                .uri("/predict")
                .body(toMlPayload(features))
                .retrieve()
                .body(MlPredictionResponse.class);

            if (response == null || response.predictions() == null || response.predictions().isEmpty()) {
                throw new MlApiUnavailableException("Prediction service returned no predictions");
            }
            return response.predictions().getFirst().predictedPrice();
        } catch (RestClientException error) {
            throw new MlApiUnavailableException("Prediction service unavailable", error);
        }
    }

    public URI mlApiBaseUrl() {
        return mlApiBaseUrl;
    }

    private Map<String, Object> toMlPayload(PropertyFeatures features) {
        return Map.of(
            "square_footage", features.squareFootage(),
            "bedrooms", features.bedrooms(),
            "bathrooms", features.bathrooms(),
            "year_built", features.yearBuilt(),
            "lot_size", features.lotSize(),
            "distance_to_city_center", features.distanceToCityCenter(),
            "school_rating", features.schoolRating()
        );
    }
}
