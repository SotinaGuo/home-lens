package com.homelens.marketanalysis.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.homelens.marketanalysis.model.MarketPropertyRecord;

class DatasetLoaderTest {

    private static final Path WORKBOOK = Path.of(
        "../ml-api/data/House Price Dataset & Test Data For Prediction.xlsx"
    );

    @Test
    void loadsMarketRowsFromTestDataSheet() {
        DatasetLoader loader = new DatasetLoader(WORKBOOK);

        List<MarketPropertyRecord> records = loader.load();

        assertThat(records).hasSize(50);
        MarketPropertyRecord first = records.getFirst();
        assertThat(first.id()).isEqualTo(1);
        assertThat(first.features().squareFootage()).isEqualTo(1250);
        assertThat(first.features().bedrooms()).isEqualTo(2);
        assertThat(first.features().bathrooms()).isEqualTo(1.0);
        assertThat(first.features().yearBuilt()).isEqualTo(1985);
        assertThat(first.features().lotSize()).isEqualTo(5200);
        assertThat(first.features().distanceToCityCenter()).isEqualTo(3.2);
        assertThat(first.features().schoolRating()).isEqualTo(7.1);
        assertThat(first.price()).isEqualTo(185000);
    }

    @Test
    void exposesImmutableRecordsAfterConstruction() {
        DatasetLoader loader = new DatasetLoader(WORKBOOK);

        assertThat(loader.recordCount()).isEqualTo(50);
        assertThat(loader.records()).hasSize(50);
    }
}
