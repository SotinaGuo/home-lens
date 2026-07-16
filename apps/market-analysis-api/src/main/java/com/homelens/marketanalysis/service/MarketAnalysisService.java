package com.homelens.marketanalysis.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.homelens.marketanalysis.dto.MarketSegmentResponse;
import com.homelens.marketanalysis.dto.MarketSummaryResponse;
import com.homelens.marketanalysis.dto.PropertyRecordResponse;
import com.homelens.marketanalysis.exception.InvalidMarketFilterException;
import com.homelens.marketanalysis.model.MarketFilters;
import com.homelens.marketanalysis.model.MarketPropertyRecord;

@Service
public class MarketAnalysisService {

    private final DatasetLoader datasetLoader;
    private final StatisticsCalculator statisticsCalculator;

    public MarketAnalysisService(
        DatasetLoader datasetLoader,
        StatisticsCalculator statisticsCalculator
    ) {
        this.datasetLoader = datasetLoader;
        this.statisticsCalculator = statisticsCalculator;
    }

    @Cacheable("marketSummary")
    public MarketSummaryResponse summary() {
        return summaryFor(datasetLoader.records());
    }

    @Cacheable("marketSegments")
    public MarketSegmentResponse segments(MarketFilters filters) {
        validate(filters);
        List<MarketPropertyRecord> filtered = datasetLoader.records().stream()
            .filter(record -> matches(record, filters))
            .sorted(Comparator.comparingInt(MarketPropertyRecord::id))
            .toList();

        return new MarketSegmentResponse(
            filters,
            filtered.size(),
            filtered.isEmpty() ? null : summaryFor(filtered),
            filtered.stream().map(PropertyRecordResponse::from).toList()
        );
    }

    MarketSummaryResponse summaryFor(List<MarketPropertyRecord> records) {
        return new MarketSummaryResponse(
            records.size(),
            statisticsCalculator.priceStats(records),
            statisticsCalculator.squareFootageStats(records),
            statisticsCalculator.bedroomStats(records),
            statisticsCalculator.bathroomStats(records),
            statisticsCalculator.schoolRatingStats(records),
            statisticsCalculator.distanceStats(records),
            statisticsCalculator.priceBuckets(records)
        );
    }

    private boolean matches(MarketPropertyRecord record, MarketFilters filters) {
        return atLeast(record.price(), filters.minPrice())
            && atMost(record.price(), filters.maxPrice())
            && atLeast(record.features().bedrooms(), filters.minBedrooms())
            && atMost(record.features().bedrooms(), filters.maxBedrooms())
            && atLeast(record.features().schoolRating(), filters.minSchoolRating())
            && atMost(record.features().distanceToCityCenter(), filters.maxDistanceToCityCenter());
    }

    private boolean atLeast(double value, Double minimum) {
        return minimum == null || value >= minimum;
    }

    private boolean atMost(double value, Double maximum) {
        return maximum == null || value <= maximum;
    }

    private boolean atLeast(int value, Integer minimum) {
        return minimum == null || value >= minimum;
    }

    private boolean atMost(int value, Integer maximum) {
        return maximum == null || value <= maximum;
    }

    private void validate(MarketFilters filters) {
        if (filters.minPrice() != null && filters.minPrice() < 0) {
            throw new InvalidMarketFilterException("minPrice cannot be negative");
        }
        if (filters.maxPrice() != null && filters.maxPrice() < 0) {
            throw new InvalidMarketFilterException("maxPrice cannot be negative");
        }
        if (filters.minPrice() != null
            && filters.maxPrice() != null
            && filters.minPrice() > filters.maxPrice()) {
            throw new InvalidMarketFilterException("minPrice cannot exceed maxPrice");
        }
        if (filters.minBedrooms() != null
            && filters.maxBedrooms() != null
            && filters.minBedrooms() > filters.maxBedrooms()) {
            throw new InvalidMarketFilterException("minBedrooms cannot exceed maxBedrooms");
        }
        if (filters.minSchoolRating() != null
            && (filters.minSchoolRating() < 0 || filters.minSchoolRating() > 10)) {
            throw new InvalidMarketFilterException("minSchoolRating must be between 0 and 10");
        }
        if (filters.maxDistanceToCityCenter() != null
            && filters.maxDistanceToCityCenter() < 0) {
            throw new InvalidMarketFilterException("maxDistanceToCityCenter cannot be negative");
        }
    }
}
