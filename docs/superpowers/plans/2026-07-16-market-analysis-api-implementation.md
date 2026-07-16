# Market Analysis API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/market-analysis-api`, a Java 21 Spring Boot 3.4.4 backend for HomeLens App 2 market statistics, filtered segments, and what-if ML predictions.

**Architecture:** The service reads the existing Excel workbook at startup into immutable in-memory records, computes market statistics through a focused service layer, exposes REST endpoints through Spring MVC controllers, and calls the existing `ml-api /predict` endpoint for what-if analysis. Summary and segment computations use Spring Cache with in-memory cache storage.

**Tech Stack:** Java 21, Spring Boot 3.4.4, Maven, Spring Web, Spring Validation, Spring Cache, Apache POI, JUnit 5, Spring Boot Test, OkHttp MockWebServer.

## Global Constraints

- Build only the `market-analysis-api` module in this phase.
- Service path must be `apps/market-analysis-api`.
- Use Java 21.
- Use Spring Boot 3.4.4.
- Read market statistics from `apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx`.
- Use the `Test Data For Prediction` sheet as the primary market statistics source.
- Integrate with `ml-api /predict` for what-if prediction.
- Default `ML_API_BASE_URL` must be `http://localhost:8000`.
- Default `MARKET_DATA_WORKBOOK_PATH` must point to `../ml-api/data/House Price Dataset & Test Data For Prediction.xlsx` from `apps/market-analysis-api`.
- Service must run locally on port `8002`.
- Use Spring Cache for summary and segment computations.
- Do not build the Next.js App 2 dashboard in this phase.
- Do not add CSV export in this phase.
- Do not add PDF export in this phase.
- Do not add authentication or authorization in this phase.
- Do not add persistent database storage in this phase.
- Do not add cross-service Docker Compose in this phase.

---

## Planned File Structure

```text
apps/
  market-analysis-api/
    README.md
    pom.xml
    src/
      main/
        java/
          com/homelens/marketanalysis/
            MarketAnalysisApplication.java
            config/
              CacheConfig.java
              MarketAnalysisProperties.java
            controller/
              HealthController.java
              MarketController.java
            dto/
              ErrorResponse.java
              HealthResponse.java
              MarketPositionResponse.java
              MarketSegmentResponse.java
              MarketSummaryResponse.java
              MlPredictionResponse.java
              PriceBucketResponse.java
              PropertyFeaturesRequest.java
              PropertyRecordResponse.java
              StatisticSummaryResponse.java
              WhatIfResponse.java
            exception/
              InvalidMarketFilterException.java
              MlApiUnavailableException.java
            model/
              MarketFilters.java
              MarketPropertyRecord.java
              PropertyFeatures.java
            service/
              DatasetLoader.java
              MarketAnalysisService.java
              MlApiClient.java
              StatisticsCalculator.java
            web/
              ApiExceptionHandler.java
        resources/
          application.yml
      test/
        java/
          com/homelens/marketanalysis/
            controller/
              HealthControllerTest.java
              MarketControllerTest.java
            service/
              DatasetLoaderTest.java
              MarketAnalysisServiceTest.java
              MlApiClientTest.java
              StatisticsCalculatorTest.java
```

## File Responsibility Map

- `pom.xml`: Spring Boot 3.4.4 dependencies, Java 21, Apache POI, test dependencies.
- `application.yml`: port `8002`, workbook path default, ML API base URL default.
- `MarketAnalysisApplication.java`: Spring Boot entry point and configuration properties scanning.
- `CacheConfig.java`: enables Spring Cache and declares `marketSummary` / `marketSegments` caches.
- `MarketAnalysisProperties.java`: typed configuration for workbook path and ML API base URL.
- `MarketPropertyRecord.java`: immutable loaded market row with actual price.
- `PropertyFeatures.java`: shared feature object sent to `ml-api`.
- `MarketFilters.java`: validated filter object for segment queries.
- `DatasetLoader.java`: reads and validates Excel rows.
- `StatisticsCalculator.java`: computes count, average, median, min, max, and price buckets.
- `MarketAnalysisService.java`: exposes summary, segments, and what-if use cases.
- `MlApiClient.java`: calls `ml-api /predict` and maps malformed/upstream errors.
- `HealthController.java`: exposes `GET /health`.
- `MarketController.java`: exposes `GET /market/summary`, `GET /market/segments`, and `POST /market/what-if`.
- `ApiExceptionHandler.java`: maps validation, filter, and ML API exceptions to stable JSON errors.
- `README.md`: setup, run, test, and integration instructions.

---

### Task 1: Scaffold Spring Boot service and health endpoint

**Files:**
- Create: `apps/market-analysis-api/pom.xml`
- Create: `apps/market-analysis-api/src/main/resources/application.yml`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/MarketAnalysisApplication.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/config/MarketAnalysisProperties.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/HealthResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/controller/HealthController.java`
- Create: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/controller/HealthControllerTest.java`

**Interfaces:**
- Consumes: none.
- Produces:
  - `MarketAnalysisProperties(Path workbookPath, URI mlApiBaseUrl)`
  - `HealthResponse(String status, String service, int recordsLoaded, String mlApiBaseUrl)`
  - `GET /health`

- [ ] **Step 1: Create Maven project directories**

Run:

```bash
mkdir -p apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/{config,controller,dto,exception,model,service,web}
mkdir -p apps/market-analysis-api/src/main/resources
mkdir -p apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/{controller,service}
```

Expected: directories exist.

- [ ] **Step 2: Create `pom.xml`**

Create `apps/market-analysis-api/pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.4</version>
    <relativePath/>
  </parent>

  <groupId>com.homelens</groupId>
  <artifactId>market-analysis-api</artifactId>
  <version>0.1.0</version>
  <name>market-analysis-api</name>
  <description>HomeLens market analysis backend</description>

  <properties>
    <java.version>21</java.version>
    <poi.version>5.4.0</poi.version>
    <mockwebserver.version>4.12.0</mockwebserver.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-cache</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.apache.poi</groupId>
      <artifactId>poi-ooxml</artifactId>
      <version>${poi.version}</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>com.squareup.okhttp3</groupId>
      <artifactId>mockwebserver</artifactId>
      <version>${mockwebserver.version}</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
```

- [ ] **Step 3: Create configuration**

Create `apps/market-analysis-api/src/main/resources/application.yml`:

```yaml
server:
  port: 8002

spring:
  application:
    name: market-analysis-api

market:
  analysis:
    workbook-path: ${MARKET_DATA_WORKBOOK_PATH:../ml-api/data/House Price Dataset & Test Data For Prediction.xlsx}
    ml-api-base-url: ${ML_API_BASE_URL:http://localhost:8000}
```

- [ ] **Step 4: Write failing health controller test**

Create `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/controller/HealthControllerTest.java`:

```java
package com.homelens.marketanalysis.controller;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;

@WebMvcTest(HealthController.class)
@EnableConfigurationProperties(MarketAnalysisProperties.class)
@TestPropertySource(properties = {
    "market.analysis.workbook-path=../ml-api/data/House Price Dataset & Test Data For Prediction.xlsx",
    "market.analysis.ml-api-base-url=http://localhost:8000"
})
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsServiceHealth() throws Exception {
        mockMvc.perform(get("/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", equalTo("ok")))
            .andExpect(jsonPath("$.service", equalTo("market-analysis-api")))
            .andExpect(jsonPath("$.records_loaded", is(0)))
            .andExpect(jsonPath("$.ml_api_base_url", equalTo("http://localhost:8000")));
    }
}
```

- [ ] **Step 5: Run test to verify RED**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=HealthControllerTest
```

Expected: FAIL because `HealthController` and DTO/config classes do not exist.

- [ ] **Step 6: Implement application, config, DTO, and controller**

Create `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/MarketAnalysisApplication.java`:

```java
package com.homelens.marketanalysis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MarketAnalysisApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarketAnalysisApplication.class, args);
    }
}
```

Create `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/config/MarketAnalysisProperties.java`:

```java
package com.homelens.marketanalysis.config;

import java.net.URI;
import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "market.analysis")
public record MarketAnalysisProperties(Path workbookPath, URI mlApiBaseUrl) {
}
```

Create `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/HealthResponse.java`:

```java
package com.homelens.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record HealthResponse(
    String status,
    String service,
    @JsonProperty("records_loaded") int recordsLoaded,
    @JsonProperty("ml_api_base_url") String mlApiBaseUrl
) {
}
```

Create `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/controller/HealthController.java`:

```java
package com.homelens.marketanalysis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.dto.HealthResponse;

@RestController
public class HealthController {

    private final MarketAnalysisProperties properties;

    public HealthController(MarketAnalysisProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(
            "ok",
            "market-analysis-api",
            0,
            properties.mlApiBaseUrl().toString()
        );
    }
}
```

- [ ] **Step 7: Run test to verify GREEN**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=HealthControllerTest
```

Expected: PASS.

- [ ] **Step 8: Run package-level check**

Run:

```bash
cd apps/market-analysis-api
mvn test
```

Expected: PASS.

- [ ] **Step 9: Commit scaffold**

```bash
git add apps/market-analysis-api
git commit -m "chore: scaffold market analysis api"
```

---

### Task 2: Add market dataset domain model and Excel loader

**Files:**
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/model/MarketPropertyRecord.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/model/PropertyFeatures.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/service/DatasetLoader.java`
- Create: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/service/DatasetLoaderTest.java`
- Modify: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/controller/HealthController.java`
- Modify: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/controller/HealthControllerTest.java`

**Interfaces:**
- Consumes: `MarketAnalysisProperties.workbookPath()`.
- Produces:
  - `MarketPropertyRecord`
  - `PropertyFeatures`
  - `DatasetLoader.load(): List<MarketPropertyRecord>`
  - `DatasetLoader.records(): List<MarketPropertyRecord>`
  - `DatasetLoader.recordCount(): int`

- [ ] **Step 1: Write failing loader tests**

Create `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/service/DatasetLoaderTest.java`:

```java
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
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=DatasetLoaderTest
```

Expected: FAIL because loader and models do not exist.

- [ ] **Step 3: Implement models**

Create `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/model/PropertyFeatures.java`:

```java
package com.homelens.marketanalysis.model;

public record PropertyFeatures(
    int squareFootage,
    int bedrooms,
    double bathrooms,
    int yearBuilt,
    int lotSize,
    double distanceToCityCenter,
    double schoolRating
) {
}
```

Create `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/model/MarketPropertyRecord.java`:

```java
package com.homelens.marketanalysis.model;

public record MarketPropertyRecord(
    int id,
    PropertyFeatures features,
    double price
) {
}
```

- [ ] **Step 4: Implement Excel loader**

Create `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/service/DatasetLoader.java`:

```java
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
```

- [ ] **Step 5: Update health record count**

Modify `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/controller/HealthController.java` to inject `DatasetLoader`:

```java
package com.homelens.marketanalysis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.dto.HealthResponse;
import com.homelens.marketanalysis.service.DatasetLoader;

@RestController
public class HealthController {

    private final MarketAnalysisProperties properties;
    private final DatasetLoader datasetLoader;

    public HealthController(MarketAnalysisProperties properties, DatasetLoader datasetLoader) {
        this.properties = properties;
        this.datasetLoader = datasetLoader;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(
            "ok",
            "market-analysis-api",
            datasetLoader.recordCount(),
            properties.mlApiBaseUrl().toString()
        );
    }
}
```

Update `HealthControllerTest` to mock `DatasetLoader`:

```java
package com.homelens.marketanalysis.controller;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
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
```

- [ ] **Step 6: Run tests to verify GREEN**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=DatasetLoaderTest,HealthControllerTest
```

Expected: PASS.

- [ ] **Step 7: Commit dataset loader**

```bash
git add apps/market-analysis-api
git commit -m "feat: load market analysis dataset"
```

---

### Task 3: Add statistics, filters, and market summary/segment service

**Files:**
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/model/MarketFilters.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/StatisticSummaryResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/PriceBucketResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/PropertyRecordResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/MarketSummaryResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/MarketSegmentResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/exception/InvalidMarketFilterException.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/service/StatisticsCalculator.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/service/MarketAnalysisService.java`
- Create: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/service/StatisticsCalculatorTest.java`
- Create: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/service/MarketAnalysisServiceTest.java`

**Interfaces:**
- Consumes: `DatasetLoader.records()`.
- Produces:
  - `StatisticsCalculator.priceStats(List<MarketPropertyRecord>): StatisticSummaryResponse`
  - `StatisticsCalculator.priceBuckets(List<MarketPropertyRecord>): List<PriceBucketResponse>`
  - `MarketAnalysisService.summary(): MarketSummaryResponse`
  - `MarketAnalysisService.segments(MarketFilters filters): MarketSegmentResponse`

- [ ] **Step 1: Write failing statistics tests**

Create `StatisticsCalculatorTest` with these test cases:

```java
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
```

- [ ] **Step 2: Write failing service tests**

Create `MarketAnalysisServiceTest`:

```java
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
```

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=StatisticsCalculatorTest,MarketAnalysisServiceTest
```

Expected: FAIL because DTOs, filters, calculator, exception, and service do not exist.

- [ ] **Step 4: Implement filter and DTO records**

Create the following records.

`MarketFilters.java`:

```java
package com.homelens.marketanalysis.model;

public record MarketFilters(
    Double minPrice,
    Double maxPrice,
    Integer minBedrooms,
    Integer maxBedrooms,
    Double minSchoolRating,
    Double maxDistanceToCityCenter
) {
}
```

`StatisticSummaryResponse.java`:

```java
package com.homelens.marketanalysis.dto;

public record StatisticSummaryResponse(
    double average,
    double median,
    double minimum,
    double maximum
) {
}
```

`PriceBucketResponse.java`:

```java
package com.homelens.marketanalysis.dto;

public record PriceBucketResponse(String label, int count) {
}
```

`PropertyRecordResponse.java`:

```java
package com.homelens.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.homelens.marketanalysis.model.MarketPropertyRecord;

public record PropertyRecordResponse(
    int id,
    @JsonProperty("square_footage") int squareFootage,
    int bedrooms,
    double bathrooms,
    @JsonProperty("year_built") int yearBuilt,
    @JsonProperty("lot_size") int lotSize,
    @JsonProperty("distance_to_city_center") double distanceToCityCenter,
    @JsonProperty("school_rating") double schoolRating,
    double price
) {
    public static PropertyRecordResponse from(MarketPropertyRecord record) {
        var features = record.features();
        return new PropertyRecordResponse(
            record.id(),
            features.squareFootage(),
            features.bedrooms(),
            features.bathrooms(),
            features.yearBuilt(),
            features.lotSize(),
            features.distanceToCityCenter(),
            features.schoolRating(),
            record.price()
        );
    }
}
```

`MarketSummaryResponse.java`:

```java
package com.homelens.marketanalysis.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MarketSummaryResponse(
    @JsonProperty("record_count") int recordCount,
    StatisticSummaryResponse price,
    @JsonProperty("square_footage") StatisticSummaryResponse squareFootage,
    StatisticSummaryResponse bedrooms,
    StatisticSummaryResponse bathrooms,
    @JsonProperty("school_rating") StatisticSummaryResponse schoolRating,
    @JsonProperty("distance_to_city_center") StatisticSummaryResponse distanceToCityCenter,
    @JsonProperty("price_buckets") List<PriceBucketResponse> priceBuckets
) {
}
```

`MarketSegmentResponse.java`:

```java
package com.homelens.marketanalysis.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.homelens.marketanalysis.model.MarketFilters;

public record MarketSegmentResponse(
    MarketFilters filters,
    @JsonProperty("record_count") int recordCount,
    MarketSummaryResponse statistics,
    List<PropertyRecordResponse> records
) {
}
```

Create `InvalidMarketFilterException.java`:

```java
package com.homelens.marketanalysis.exception;

public class InvalidMarketFilterException extends RuntimeException {

    public InvalidMarketFilterException(String message) {
        super(message);
    }
}
```

- [ ] **Step 5: Implement statistics calculator**

Create `StatisticsCalculator.java`:

```java
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
```

- [ ] **Step 6: Implement market analysis service**

Create `MarketAnalysisService.java`:

```java
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
```

- [ ] **Step 7: Run tests to verify GREEN**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=StatisticsCalculatorTest,MarketAnalysisServiceTest
```

Expected: PASS.

- [ ] **Step 8: Commit statistics and service**

```bash
git add apps/market-analysis-api
git commit -m "feat: add market summary and segment analysis"
```

---

### Task 4: Add REST endpoints, caching config, and API error handling

**Files:**
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/config/CacheConfig.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/controller/MarketController.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/ErrorResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/web/ApiExceptionHandler.java`
- Create: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/controller/MarketControllerTest.java`

**Interfaces:**
- Consumes:
  - `MarketAnalysisService.summary()`
  - `MarketAnalysisService.segments(MarketFilters filters)`
- Produces:
  - `GET /market/summary`
  - `GET /market/segments`
  - stable `{"detail": "..."}` error responses

- [ ] **Step 1: Write failing API tests**

Create `MarketControllerTest.java`:

```java
package com.homelens.marketanalysis.controller;

import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.homelens.marketanalysis.dto.MarketSegmentResponse;
import com.homelens.marketanalysis.dto.MarketSummaryResponse;
import com.homelens.marketanalysis.dto.PriceBucketResponse;
import com.homelens.marketanalysis.dto.StatisticSummaryResponse;
import com.homelens.marketanalysis.exception.InvalidMarketFilterException;
import com.homelens.marketanalysis.model.MarketFilters;
import com.homelens.marketanalysis.service.MarketAnalysisService;
import com.homelens.marketanalysis.web.ApiExceptionHandler;

@WebMvcTest(MarketController.class)
class MarketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MarketAnalysisService marketAnalysisService;

    @Test
    void returnsMarketSummary() throws Exception {
        given(marketAnalysisService.summary()).willReturn(summary());

        mockMvc.perform(get("/market/summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.record_count", equalTo(2)))
            .andExpect(jsonPath("$.price.average", equalTo(225000.0)))
            .andExpect(jsonPath("$.price_buckets[0].label", equalTo("< $250k")));
    }

    @Test
    void returnsMarketSegmentsWithFilters() throws Exception {
        given(marketAnalysisService.segments(any(MarketFilters.class))).willReturn(
            new MarketSegmentResponse(new MarketFilters(null, null, 3, null, 7.0, null), 0, null, List.of())
        );

        mockMvc.perform(get("/market/segments?minBedrooms=3&minSchoolRating=7"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.record_count", equalTo(0)))
            .andExpect(jsonPath("$.statistics").doesNotExist())
            .andExpect(jsonPath("$.records").isArray());
    }

    @Test
    void returnsBadRequestForInvalidFilters() throws Exception {
        given(marketAnalysisService.segments(any(MarketFilters.class)))
            .willThrow(new InvalidMarketFilterException("minPrice cannot exceed maxPrice"));

        mockMvc.perform(get("/market/segments?minPrice=400000&maxPrice=200000"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail", equalTo("minPrice cannot exceed maxPrice")));
    }

    private MarketSummaryResponse summary() {
        return new MarketSummaryResponse(
            2,
            new StatisticSummaryResponse(225000.0, 225000.0, 185000.0, 265000.0),
            new StatisticSummaryResponse(1550.0, 1550.0, 1250.0, 1850.0),
            new StatisticSummaryResponse(2.5, 2.5, 2.0, 3.0),
            new StatisticSummaryResponse(1.5, 1.5, 1.0, 2.0),
            new StatisticSummaryResponse(7.65, 7.65, 7.1, 8.2),
            new StatisticSummaryResponse(4.4, 4.4, 3.2, 5.6),
            List.of(new PriceBucketResponse("< $250k", 1))
        );
    }
}
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=MarketControllerTest
```

Expected: FAIL because controller and error handler do not exist.

- [ ] **Step 3: Implement cache config**

Create `CacheConfig.java`:

```java
package com.homelens.marketanalysis.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("marketSummary", "marketSegments");
    }
}
```

- [ ] **Step 4: Implement controller**

Create `MarketController.java`:

```java
package com.homelens.marketanalysis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.homelens.marketanalysis.dto.MarketSegmentResponse;
import com.homelens.marketanalysis.dto.MarketSummaryResponse;
import com.homelens.marketanalysis.model.MarketFilters;
import com.homelens.marketanalysis.service.MarketAnalysisService;

@RestController
public class MarketController {

    private final MarketAnalysisService marketAnalysisService;

    public MarketController(MarketAnalysisService marketAnalysisService) {
        this.marketAnalysisService = marketAnalysisService;
    }

    @GetMapping("/market/summary")
    public MarketSummaryResponse summary() {
        return marketAnalysisService.summary();
    }

    @GetMapping("/market/segments")
    public MarketSegmentResponse segments(
        @RequestParam(required = false) Double minPrice,
        @RequestParam(required = false) Double maxPrice,
        @RequestParam(required = false) Integer minBedrooms,
        @RequestParam(required = false) Integer maxBedrooms,
        @RequestParam(required = false) Double minSchoolRating,
        @RequestParam(required = false) Double maxDistanceToCityCenter
    ) {
        return marketAnalysisService.segments(new MarketFilters(
            minPrice,
            maxPrice,
            minBedrooms,
            maxBedrooms,
            minSchoolRating,
            maxDistanceToCityCenter
        ));
    }
}
```

- [ ] **Step 5: Implement error response and exception handler**

Create `ErrorResponse.java`:

```java
package com.homelens.marketanalysis.dto;

public record ErrorResponse(String detail) {
}
```

Create `ApiExceptionHandler.java`:

```java
package com.homelens.marketanalysis.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.homelens.marketanalysis.dto.ErrorResponse;
import com.homelens.marketanalysis.exception.InvalidMarketFilterException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(InvalidMarketFilterException.class)
    public ResponseEntity<ErrorResponse> invalidFilter(InvalidMarketFilterException error) {
        return ResponseEntity.badRequest().body(new ErrorResponse(error.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> invalidBody(MethodArgumentNotValidException error) {
        String detail = error.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(fieldError -> fieldError.getField() + " " + fieldError.getDefaultMessage())
            .orElse("Invalid request");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(detail));
    }
}
```

- [ ] **Step 6: Run tests to verify GREEN**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=MarketControllerTest
```

Expected: PASS.

- [ ] **Step 7: Run all Java tests**

Run:

```bash
cd apps/market-analysis-api
mvn test
```

Expected: PASS.

- [ ] **Step 8: Commit REST API**

```bash
git add apps/market-analysis-api
git commit -m "feat: expose market summary and segment endpoints"
```

---

### Task 5: Add ML API client and what-if endpoint

**Files:**
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/PropertyFeaturesRequest.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/MlPredictionResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/MarketPositionResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/dto/WhatIfResponse.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/exception/MlApiUnavailableException.java`
- Create: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/service/MlApiClient.java`
- Create: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/service/MlApiClientTest.java`
- Modify: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/service/MarketAnalysisService.java`
- Modify: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/controller/MarketController.java`
- Modify: `apps/market-analysis-api/src/main/java/com/homelens/marketanalysis/web/ApiExceptionHandler.java`
- Modify: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/controller/MarketControllerTest.java`
- Modify: `apps/market-analysis-api/src/test/java/com/homelens/marketanalysis/service/MarketAnalysisServiceTest.java`

**Interfaces:**
- Consumes:
  - `ml-api POST /predict` response `{ "count": 1, "predictions": [{ "predicted_price": 123.45 }] }`
  - `DatasetLoader.records()`
- Produces:
  - `MlApiClient.predict(PropertyFeatures features): double`
  - `MarketAnalysisService.whatIf(PropertyFeatures features): WhatIfResponse`
  - `POST /market/what-if`

- [ ] **Step 1: Write failing ML client tests**

Create `MlApiClientTest.java`:

```java
package com.homelens.marketanalysis.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;

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
        assertThat(request.getBody().readUtf8()).contains("square_footage");
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

    private PropertyFeatures features() {
        return new PropertyFeatures(1550, 3, 2.0, 1997, 6800, 4.1, 7.6);
    }
}
```

- [ ] **Step 2: Write failing what-if service test**

Add to `MarketAnalysisServiceTest`:

```java
@Test
void returnsWhatIfPredictionWithMarketPosition() {
    MlApiClient mlApiClient = Mockito.mock(MlApiClient.class);
    MarketAnalysisService service = new MarketAnalysisService(
        datasetLoader,
        new StatisticsCalculator(),
        mlApiClient
    );
    given(datasetLoader.records()).willReturn(List.of(
        record(1, 200000, 3, 7.0, 5.0),
        record(2, 300000, 3, 8.0, 6.0),
        record(3, 400000, 4, 9.0, 7.0)
    ));
    var features = new PropertyFeatures(1550, 3, 2.0, 1997, 6800, 4.1, 7.6);
    given(mlApiClient.predict(features)).willReturn(350000.0);

    var response = service.whatIf(features);

    assertThat(response.predictedPrice()).isEqualTo(350000.0);
    assertThat(response.marketPosition().percentile()).isEqualTo(66.67);
    assertThat(response.marketPosition().aboveMarketAverage()).isTrue();
    assertThat(response.nearestRecords()).extracting("id").containsExactly(2, 3, 1);
}
```

Update existing `MarketAnalysisServiceTest` constructor setup to include a mocked `MlApiClient` for tests that do not call it.

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=MlApiClientTest,MarketAnalysisServiceTest
```

Expected: FAIL because ML client, DTOs, and what-if service are missing.

- [ ] **Step 4: Implement request/response DTOs**

Create `PropertyFeaturesRequest.java`:

```java
package com.homelens.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.homelens.marketanalysis.model.PropertyFeatures;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

public record PropertyFeaturesRequest(
    @JsonProperty("square_footage") @Positive int squareFootage,
    @Min(0) int bedrooms,
    @DecimalMin("0.0") double bathrooms,
    @JsonProperty("year_built") @Min(1800) int yearBuilt,
    @JsonProperty("lot_size") @Positive int lotSize,
    @JsonProperty("distance_to_city_center") @DecimalMin("0.0") double distanceToCityCenter,
    @JsonProperty("school_rating") @DecimalMin("0.0") @DecimalMax("10.0") double schoolRating
) {
    public PropertyFeatures toModel() {
        return new PropertyFeatures(
            squareFootage,
            bedrooms,
            bathrooms,
            yearBuilt,
            lotSize,
            distanceToCityCenter,
            schoolRating
        );
    }
}
```

Create `MlPredictionResponse.java`:

```java
package com.homelens.marketanalysis.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MlPredictionResponse(
    int count,
    List<PredictionItem> predictions
) {
    public record PredictionItem(@JsonProperty("predicted_price") double predictedPrice) {
    }
}
```

Create `MarketPositionResponse.java`:

```java
package com.homelens.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MarketPositionResponse(
    double percentile,
    @JsonProperty("above_market_average") boolean aboveMarketAverage,
    @JsonProperty("difference_from_average") double differenceFromAverage
) {
}
```

Create `WhatIfResponse.java`:

```java
package com.homelens.marketanalysis.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WhatIfResponse(
    @JsonProperty("predicted_price") double predictedPrice,
    @JsonProperty("market_position") MarketPositionResponse marketPosition,
    @JsonProperty("nearest_records") List<PropertyRecordResponse> nearestRecords
) {
}
```

Create `MlApiUnavailableException.java`:

```java
package com.homelens.marketanalysis.exception;

public class MlApiUnavailableException extends RuntimeException {

    public MlApiUnavailableException(String message) {
        super(message);
    }

    public MlApiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

- [ ] **Step 5: Implement ML API client**

Create `MlApiClient.java`:

```java
package com.homelens.marketanalysis.service;

import java.net.URI;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.homelens.marketanalysis.config.MarketAnalysisProperties;
import com.homelens.marketanalysis.dto.MlPredictionResponse;
import com.homelens.marketanalysis.exception.MlApiUnavailableException;
import com.homelens.marketanalysis.model.PropertyFeatures;

@Component
public class MlApiClient {

    private final RestClient restClient;
    private final URI mlApiBaseUrl;

    public MlApiClient(RestClient.Builder builder, MarketAnalysisProperties properties) {
        this(builder, properties.mlApiBaseUrl());
    }

    MlApiClient(RestClient.Builder builder, URI mlApiBaseUrl) {
        this.restClient = builder.baseUrl(mlApiBaseUrl.toString()).build();
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
```

- [ ] **Step 6: Add what-if service logic**

Modify `MarketAnalysisService` constructor to accept `MlApiClient`.

Add method:

```java
public WhatIfResponse whatIf(PropertyFeatures features) {
    double predictedPrice = mlApiClient.predict(features);
    List<MarketPropertyRecord> records = datasetLoader.records();
    StatisticSummaryResponse priceStats = statisticsCalculator.priceStats(records);
    double averagePrice = priceStats == null ? 0 : priceStats.average();
    double percentile = percentile(predictedPrice, records);

    List<PropertyRecordResponse> nearestRecords = records.stream()
        .sorted(Comparator.comparingDouble(record -> Math.abs(record.price() - predictedPrice)))
        .limit(3)
        .map(PropertyRecordResponse::from)
        .toList();

    return new WhatIfResponse(
        round(predictedPrice),
        new MarketPositionResponse(
            percentile,
            predictedPrice > averagePrice,
            round(predictedPrice - averagePrice)
        ),
        nearestRecords
    );
}

private double percentile(double predictedPrice, List<MarketPropertyRecord> records) {
    if (records.isEmpty()) {
        return 0;
    }
    long belowOrEqual = records.stream()
        .filter(record -> record.price() <= predictedPrice)
        .count();
    return round((belowOrEqual * 100.0) / records.size());
}

private double round(double value) {
    return Math.round(value * 100.0) / 100.0;
}
```

- [ ] **Step 7: Add controller endpoint and 502 error mapping**

Modify `MarketController`:

```java
@PostMapping("/market/what-if")
public WhatIfResponse whatIf(@Valid @RequestBody PropertyFeaturesRequest request) {
    return marketAnalysisService.whatIf(request.toModel());
}
```

Add imports:

```java
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.homelens.marketanalysis.dto.PropertyFeaturesRequest;
import com.homelens.marketanalysis.dto.WhatIfResponse;
import jakarta.validation.Valid;
```

Modify `ApiExceptionHandler`:

```java
@ExceptionHandler(MlApiUnavailableException.class)
public ResponseEntity<ErrorResponse> mlApiUnavailable(MlApiUnavailableException error) {
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
        .body(new ErrorResponse("Prediction service unavailable"));
}
```

Add import:

```java
import com.homelens.marketanalysis.exception.MlApiUnavailableException;
```

- [ ] **Step 8: Add API tests for what-if**

Add to `MarketControllerTest`:

```java
@Test
void returnsWhatIfResponse() throws Exception {
    given(marketAnalysisService.whatIf(any())).willReturn(new WhatIfResponse(
        250829.56,
        new MarketPositionResponse(46.0, false, -12450.44),
        List.of()
    ));

    mockMvc.perform(post("/market/what-if")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "square_footage": 1550,
                  "bedrooms": 3,
                  "bathrooms": 2,
                  "year_built": 1997,
                  "lot_size": 6800,
                  "distance_to_city_center": 4.1,
                  "school_rating": 7.6
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.predicted_price", equalTo(250829.56)))
        .andExpect(jsonPath("$.market_position.percentile", equalTo(46.0)));
}

@Test
void mapsMlApiFailureToBadGateway() throws Exception {
    given(marketAnalysisService.whatIf(any()))
        .willThrow(new MlApiUnavailableException("Prediction service unavailable"));

    mockMvc.perform(post("/market/what-if")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "square_footage": 1550,
                  "bedrooms": 3,
                  "bathrooms": 2,
                  "year_built": 1997,
                  "lot_size": 6800,
                  "distance_to_city_center": 4.1,
                  "school_rating": 7.6
                }
                """))
        .andExpect(status().isBadGateway())
        .andExpect(jsonPath("$.detail", equalTo("Prediction service unavailable")));
}
```

Add imports:

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import org.springframework.http.MediaType;
import com.homelens.marketanalysis.dto.MarketPositionResponse;
import com.homelens.marketanalysis.dto.WhatIfResponse;
import com.homelens.marketanalysis.exception.MlApiUnavailableException;
```

- [ ] **Step 9: Run tests to verify GREEN**

Run:

```bash
cd apps/market-analysis-api
mvn test -Dtest=MlApiClientTest,MarketAnalysisServiceTest,MarketControllerTest
```

Expected: PASS.

- [ ] **Step 10: Run all Java tests**

Run:

```bash
cd apps/market-analysis-api
mvn test
```

Expected: PASS.

- [ ] **Step 11: Commit what-if endpoint**

```bash
git add apps/market-analysis-api
git commit -m "feat: add market what-if analysis"
```

---

### Task 6: Add README and final verification

**Files:**
- Create: `apps/market-analysis-api/README.md`

**Interfaces:**
- Consumes: completed `apps/market-analysis-api`.
- Produces: local setup, run, test, and integration instructions.

- [ ] **Step 1: Create README**

Create `apps/market-analysis-api/README.md`:

```markdown
# HomeLens Market Analysis API

Java Spring Boot backend for HomeLens App 2: Property Market Analysis.

## What this service does

- Loads market records from the existing housing Excel workbook.
- Generates aggregate market statistics.
- Supports filtered market segment analysis.
- Calls `ml-api /predict` for what-if analysis.
- Uses Spring Cache for summary and segment calculations.

## What is intentionally not included yet

- Next.js App 2 dashboard.
- CSV export.
- PDF export.
- Authentication or authorization.
- Persistent database storage.
- Cross-service Docker Compose.

## Local setup

```bash
cd apps/market-analysis-api
mvn test
```

## Run with ml-api

Terminal 1: start `ml-api`.

```bash
cd apps/ml-api
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Terminal 2: start this service.

```bash
cd apps/market-analysis-api
ML_API_BASE_URL=http://localhost:8000 mvn spring-boot:run
```

Open:

```text
http://localhost:8002/health
```

## Environment variables

```text
ML_API_BASE_URL=http://localhost:8000
MARKET_DATA_WORKBOOK_PATH=../ml-api/data/House Price Dataset & Test Data For Prediction.xlsx
```

## API endpoints

- `GET /health`
- `GET /market/summary`
- `GET /market/segments`
- `POST /market/what-if`

## Example what-if request

```bash
curl -X POST http://localhost:8002/market/what-if \
  -H 'content-type: application/json' \
  -d '{
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  }'
```

## Test

```bash
mvn test
```

## Notes for interview demo

The dataset is small, so statistics are demonstration analytics rather than production real-estate market intelligence. The main purpose of this service is to show clean Java backend engineering: Excel ingestion, aggregate calculations, filters, caching, ML API integration, validation, and tests.
```

- [ ] **Step 2: Run Java checks**

Run:

```bash
cd apps/market-analysis-api
mvn test
```

Expected: PASS.

- [ ] **Step 3: Run cross-service smoke**

Start `ml-api`:

```bash
cd apps/ml-api
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start Java service:

```bash
cd apps/market-analysis-api
ML_API_BASE_URL=http://localhost:8000 mvn spring-boot:run
```

Smoke commands:

```bash
curl -sS http://127.0.0.1:8002/health
curl -sS http://127.0.0.1:8002/market/summary
curl -sS 'http://127.0.0.1:8002/market/segments?minBedrooms=3&minSchoolRating=7'
curl -sS -X POST http://127.0.0.1:8002/market/what-if \
  -H 'content-type: application/json' \
  -d '{"square_footage":1550,"bedrooms":3,"bathrooms":2,"year_built":1997,"lot_size":6800,"distance_to_city_center":4.1,"school_rating":7.6}'
```

Expected:

- `/health` returns `status: "ok"` and `records_loaded: 50`.
- `/market/summary` returns `record_count: 50`.
- `/market/segments` returns `record_count` and `records`.
- `/market/what-if` returns `predicted_price` and `market_position`.

- [ ] **Step 4: Commit README**

```bash
git add apps/market-analysis-api/README.md
git commit -m "docs: add market analysis api usage instructions"
```

---

## Final Branch Review

After all tasks are complete:

- Run final Java checks:

```bash
cd apps/market-analysis-api
mvn test
```

- Run existing unaffected service checks if time permits:

```bash
cd apps/ml-api
.venv/bin/pytest -q
cd ../property-estimator-api
.venv/bin/pytest -q
cd ../web-portal
npm run test
npm run lint
npm run typecheck
npm run build
```

- Request whole-branch code review.
- Fix any Critical or Important issues.
- Use `finishing-a-development-branch` to merge/push.

## Known Follow-up Modules

- Connect Next.js `/market-analysis` to this Java backend.
- Add App 2 dashboard charts and filters.
- Add CSV/PDF export.
- Add cross-service Docker Compose for demo convenience.
