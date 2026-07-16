package com.homelens.marketanalysis.service;

import java.util.Comparator;
import java.util.List;
import java.util.function.ToDoubleFunction;

import org.springframework.stereotype.Component;

import com.homelens.marketanalysis.dto.PriceBucketResponse;
import com.homelens.marketanalysis.dto.StatisticSummaryResponse;
import com.homelens.marketanalysis.model.MarketPropertyRecord;

@Component
public class StatisticsCalculator {

    public StatisticSummaryResponse priceStats(List<MarketPropertyRecord> records) {
        return stats(records, MarketPropertyRecord::price);
    }

    public StatisticSummaryResponse squareFootageStats(List<MarketPropertyRecord> records) {
        return stats(records, record -> record.features().squareFootage());
    }

    public StatisticSummaryResponse bedroomStats(List<MarketPropertyRecord> records) {
        return stats(records, record -> record.features().bedrooms());
    }

    public StatisticSummaryResponse bathroomStats(List<MarketPropertyRecord> records) {
        return stats(records, record -> record.features().bathrooms());
    }

    public StatisticSummaryResponse schoolRatingStats(List<MarketPropertyRecord> records) {
        return stats(records, record -> record.features().schoolRating());
    }

    public StatisticSummaryResponse distanceStats(List<MarketPropertyRecord> records) {
        return stats(records, record -> record.features().distanceToCityCenter());
    }

    public List<PriceBucketResponse> priceBuckets(List<MarketPropertyRecord> records) {
        int low = 0;
        int middle = 0;
        int high = 0;
        for (MarketPropertyRecord record : records) {
            if (record.price() < 250000) {
                low++;
            } else if (record.price() <= 400000) {
                middle++;
            } else {
                high++;
            }
        }
        return List.of(
            new PriceBucketResponse("< $250k", low),
            new PriceBucketResponse("$250k-$400k", middle),
            new PriceBucketResponse("> $400k", high)
        );
    }

    private StatisticSummaryResponse stats(
        List<MarketPropertyRecord> records,
        ToDoubleFunction<MarketPropertyRecord> extractor
    ) {
        if (records.isEmpty()) {
            return null;
        }

        List<Double> values = records.stream()
            .map(extractor::applyAsDouble)
            .sorted(Comparator.naturalOrder())
            .toList();

        double average = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double median = median(values);
        return new StatisticSummaryResponse(
            round(average),
            round(median),
            round(values.getFirst()),
            round(values.getLast())
        );
    }

    private double median(List<Double> values) {
        int size = values.size();
        int middle = size / 2;
        if (size % 2 == 1) {
            return values.get(middle);
        }
        return (values.get(middle - 1) + values.get(middle)) / 2.0;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
