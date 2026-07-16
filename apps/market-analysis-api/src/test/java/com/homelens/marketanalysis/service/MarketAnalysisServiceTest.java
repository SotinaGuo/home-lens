package com.homelens.marketanalysis.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.homelens.marketanalysis.exception.InvalidMarketFilterException;
import com.homelens.marketanalysis.model.MarketFilters;
import com.homelens.marketanalysis.model.MarketPropertyRecord;
import com.homelens.marketanalysis.model.PropertyFeatures;

class MarketAnalysisServiceTest {

    private final DatasetLoader datasetLoader = Mockito.mock(DatasetLoader.class);
    private final MarketAnalysisService service = new MarketAnalysisService(
        datasetLoader,
        new StatisticsCalculator()
    );

    @Test
    void returnsFullMarketSummary() {
        given(datasetLoader.records()).willReturn(List.of(
            record(1, 185000, 2, 7.1, 3.2),
            record(2, 265000, 3, 8.2, 5.6)
        ));

        var summary = service.summary();

        assertThat(summary.recordCount()).isEqualTo(2);
        assertThat(summary.price().average()).isEqualTo(225000.0);
    }

    @Test
    void filtersSegmentsByBedroomsSchoolAndDistance() {
        given(datasetLoader.records()).willReturn(List.of(
            record(1, 185000, 2, 7.1, 3.2),
            record(2, 265000, 3, 8.2, 5.6),
            record(3, 450000, 4, 6.5, 8.5)
        ));

        var filters = new MarketFilters(null, null, 3, null, 8.0, 6.0);

        var segment = service.segments(filters);

        assertThat(segment.recordCount()).isEqualTo(1);
        assertThat(segment.records()).extracting("id").containsExactly(2);
    }

    @Test
    void rejectsInvalidFilterRanges() {
        var filters = new MarketFilters(400000.0, 200000.0, null, null, null, null);

        assertThatThrownBy(() -> service.segments(filters))
            .isInstanceOf(InvalidMarketFilterException.class)
            .hasMessageContaining("minPrice cannot exceed maxPrice");
    }

    private MarketPropertyRecord record(
        int id,
        double price,
        int bedrooms,
        double schoolRating,
        double distance
    ) {
        return new MarketPropertyRecord(
            id,
            new PropertyFeatures(1500, bedrooms, 2.0, 2000, 6000, distance, schoolRating),
            price
        );
    }
}
