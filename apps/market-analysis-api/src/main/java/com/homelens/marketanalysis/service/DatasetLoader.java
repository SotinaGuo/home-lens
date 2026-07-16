package com.homelens.marketanalysis.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.model.MarketPropertyRecord;
import com.homelens.marketanalysis.model.PropertyFeatures;

@Component
public class DatasetLoader {

    private static final String MARKET_SHEET = "Test Data For Prediction";

    private final Path workbookPath;
    private final List<MarketPropertyRecord> records;

    public DatasetLoader(MarketAnalysisProperties properties) {
        this(properties.workbookPath());
    }

    DatasetLoader(Path workbookPath) {
        this.workbookPath = workbookPath;
        this.records = List.copyOf(load());
    }

    public List<MarketPropertyRecord> load() {
        if (!Files.exists(workbookPath)) {
            throw new IllegalStateException("Market data workbook not found: " + workbookPath);
        }

        try (InputStream inputStream = Files.newInputStream(workbookPath);
             Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheet(MARKET_SHEET);
            if (sheet == null) {
                throw new IllegalStateException("Workbook is missing sheet: " + MARKET_SHEET);
            }
            return readRows(sheet);
        } catch (IOException error) {
            throw new IllegalStateException("Failed to read market data workbook", error);
        }
    }

    public List<MarketPropertyRecord> records() {
        return records;
    }

    public int recordCount() {
        return records.size();
    }

    private List<MarketPropertyRecord> readRows(Sheet sheet) {
        List<MarketPropertyRecord> loaded = new ArrayList<>();
        for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }
            loaded.add(new MarketPropertyRecord(
                number(row, 0).intValue(),
                new PropertyFeatures(
                    number(row, 1).intValue(),
                    number(row, 2).intValue(),
                    number(row, 3),
                    number(row, 4).intValue(),
                    number(row, 5).intValue(),
                    number(row, 6),
                    number(row, 7)
                ),
                number(row, 8)
            ));
        }
        return loaded;
    }

    private Double number(Row row, int cellIndex) {
        return row.getCell(cellIndex).getNumericCellValue();
    }
}
