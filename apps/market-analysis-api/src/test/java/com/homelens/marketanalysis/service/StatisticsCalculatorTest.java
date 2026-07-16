package com.homelens.marketanalysis.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.homelens.marketanalysis.dto.StatisticSummaryResponse;
import com.homelens.marketanalysis.model.MarketPropertyRecord;
import com.homelens.marketanalysis.model.PropertyFeatures;

class StatisticsCalculatorTest {

    private final StatisticsCalculator calculator = new StatisticsCalculator();

    @Test
    void calculatesAverageMedianMinimumAndMaximum() {
        List<MarketPropertyRecord> records = List.of(
            record(1, 100000),
            record(2, 200000),
            record(3, 400000)
        );

        StatisticSummaryResponse stats = calculator.priceStats(records);

        assertThat(stats.average()).isEqualTo(233333.33);
        assertThat(stats.median()).isEqualTo(200000.0);
        assertThat(stats.minimum()).isEqualTo(100000.0);
        assertThat(stats.maximum()).isEqualTo(400000.0);
    }

    @Test
    void returnsNullStatsForEmptyRecords() {
        assertThat(calculator.priceStats(List.of())).isNull();
    }

    @Test
    void createsThreePriceBuckets() {
        List<MarketPropertyRecord> records = List.of(
            record(1, 200000),
            record(2, 300000),
            record(3, 450000)
        );

        assertThat(calculator.priceBuckets(records))
            .extracting("label")
            .containsExactly("< $250k", "$250k-$400k", "> $400k");
        assertThat(calculator.priceBuckets(records))
            .extracting("count")
            .containsExactly(1, 1, 1);
    }

    private MarketPropertyRecord record(int id, double price) {
        return new MarketPropertyRecord(
            id,
            new PropertyFeatures(1500, 3, 2.0, 2000, 6000, 5.0, 7.0),
            price
        );
    }
}
