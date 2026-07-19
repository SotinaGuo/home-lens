# HomeLens 项目文档

## 一、项目概述

HomeLens 是一个全栈房产估价系统，包含四个独立服务：**Web Portal**（Next.js 前端）、**Property Estimator API**（FastAPI 业务编排层）、**ML API**（FastAPI 机器学习推理服务）、**Market Analysis API**（Spring Boot 市场分析服务）。用户在 Web 界面提交房产特征，系统调用 ML 模型预测房价，支持估价记录存储、历史查看、多记录对比，以及市场全景分析。

---

## 二、技术栈

| 组件 | 技术 | 核心依赖 |
|------|------|----------|
| Web Portal | Next.js 15.5 (App Router), React 19.1, TypeScript 5.8 | TailwindCSS 3.4, React Hook Form 7.60, Zod 3.25, Recharts 2.15 |
| Property Estimator API | FastAPI (Python 3.12) | Pydantic 2.8, pydantic-settings 2.4, httpx 0.27 |
| ML API | FastAPI (Python 3.12) | scikit-learn 1.5, pandas 2.2, joblib 1.4, numpy 1.26, openpyxl 3.1 |
| Market Analysis API | Spring Boot 3.4.4 (Java 21) | poi-ooxml 5.4.0, spring-boot-starter-cache |

---

## 三、项目架构

```
用户浏览器 (Port 3000)
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│  Web Portal (Next.js)                                    │
│  页面渲染 · API 代理 · 双应用入口                          │
└──────┬────────────────────────────┬──────────────────────┘
       │ HTTP                       │ HTTP
       ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  Property Estimator API  │  │  Market Analysis API         │
│  (Port 8001)             │  │  (Port 8002)                 │
│  业务编排 · 记录存储      │  │  市场统计 · 分段分析 · What-if │
└──────────┬───────────────┘  └──────────────┬───────────────┘
           │ HTTP                            │ HTTP
           ▼                                 ▼
┌──────────────────────────────────────────────────────────┐
│  ML API (Port 8000)                                      │
│  模型训练 · 预测推理 · 元数据查询                           │
└──────────────────────────────────────────────────────────┘
```

**数据流：**
- Portal 表单提交 → Estimator API 编排 → ML API 预测 → 结果返回并存储 → 前端展示
- Portal 市场查询 → Market Analysis API → ML API 预测 + Excel 数据 → 市场分析结果

---

## 四、各服务功能

### 4.1 ML API（机器学习预测服务，端口 8000）

房价预测模型的训练与推理服务。

- **自动训练：** 启动时若模型文件缺失，从 Excel 数据集自动训练 Ridge 回归模型（StandardScaler + Ridge 管道）
- **模型预测：** 接收房产特征，返回预测价格，支持单条和批量
- **模型信息：** 暴露算法类型、特征系数、MAE/RMSE/R² 训练指标、样本量等元数据

**输入特征（7 项）：** square_footage、bedrooms、bathrooms、year_built、lot_size、distance_to_city_center、school_rating

**核心文件：**

| 文件 | 职责 |
|------|------|
| `app/main.py` | API 路由 |
| `app/model_service.py` | 模型加载/预测/信息查询 |
| `app/training.py` | 训练管道（读取Excel→训练→持久化） |
| `app/schemas.py` | 请求/响应 Pydantic 模型 |
| `app/config.py` | 特征列、路径、超参数 |

---

### 4.2 Property Estimator API（房产估价编排服务，端口 8001）

业务逻辑编排层，连接前端与 ML 服务，管理估价记录生命周期。

- **创建估价：** 接收房产特征 → 调用 ML API 预测 → 存储记录
- **估价列表：** 分页查询历史估价
- **估价详情：** 按 ID 查单条记录
- **估价对比：** 选取多条记录，返回最高价、最低价、价差
- **健康检查：** 服务状态及下游 ML API 地址

**设计模式：** Service 层协调 Repository + ML Client；Protocol 依赖注入；RLock 线程安全内存存储；自定义异常类

**核心文件：**

| 文件 | 职责 |
|------|------|
| `app/main.py` | API 路由 |
| `app/service.py` | 业务逻辑（create/list/compare） |
| `app/repository.py` | 线程安全内存存储 |
| `app/ml_client.py` | ML API HTTP 客户端 |
| `app/schemas.py` | Pydantic 模型 |
| `app/config.py` | 环境变量配置 |

---

### 4.3 Market Analysis API（市场分析服务，端口 8002）

基于真实房产数据集的批量市场分析服务，Spring Boot + Java 21 实现。

- **市场概览：** 全量房产统计摘要（均价、中位数、极值、分位数），覆盖价格、面积、单价等维度
- **分段分析：** 按卧室数、学校评分、距市中心距离、价格区间筛选细分市场，返回各段统计
- **What-if 分析：** 输入房产特征 → 调用 ML API 预测价格 → 在数据集中找到最近邻 → 返回市场定位（百分位排名）
- **价格分布：** 按价格区间分桶统计
- **缓存加速：** Spring Cache 对汇总统计做缓存

**核心文件：**

| 文件 | 职责 |
|------|------|
| `MarketAnalysisController.java` | REST API 控制器 |
| `MarketAnalysisService.java` | 业务逻辑 |
| `DatasetLoader.java` | Excel 数据集加载 |
| `MlApiClient.java` | ML API HTTP 客户端 |
| `StatisticsCalculator.java` | 统计计算（均值、中位数、分位数、分桶） |
| `dto/` | 请求/响应 DTO（StatisticSummary, PriceBucket, MarketSegment, WhatIfResult 等） |

---

### 4.4 Web Portal（前端门户，端口 3000）

面向用户的 Next.js Web 界面，双应用入口。

**页面路由：**

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 应用导航卡片入口 |
| `/property-estimator` | 估价应用 | 表单提交、结果展示、历史记录、对比分析 |
| `/market-analysis` | 市场分析 | 市场概览、分段筛选、What-if 分析 |

**API 代理路由（Next.js API Routes 透传）：**

| Portal 路由 | 方法 | 转发到 |
|-------------|------|--------|
| `/api/property-estimator/health` | GET | Property Estimator `/health` |
| `/api/property-estimator/estimates` | GET, POST | Property Estimator `/estimates` |
| `/api/property-estimator/estimates/[id]` | GET | Property Estimator `/estimates/{id}` |
| `/api/property-estimator/comparisons` | POST | Property Estimator `/comparisons` |
| `/api/market-analysis/health` | GET | Market Analysis `/health` |
| `/api/market-analysis/summary` | GET | Market Analysis `/summary` |
| `/api/market-analysis/segments` | GET | Market Analysis `/segments` |
| `/api/market-analysis/what-if` | POST | Market Analysis `/what-if` |

**前端结构：**

```
apps/web-portal/
├── app/
│   ├── layout.tsx              # Root Layout
│   ├── loading.tsx             # App Router 路由级 Loading
│   ├── error.tsx               # App Router 路由级 Error Boundary
│   ├── page.tsx                # 首页
│   ├── property-estimator/     # App 1 页面入口
│   ├── market-analysis/        # App 2 页面入口
│   ├── api/                    # Next.js API Proxy Routes
│   └── __tests__/              # App Shell / 路由层测试
├── components/
│   ├── app-shell.tsx           # 全局布局：Header + 导航栏
│   ├── nav-link.tsx            # 导航链接状态
│   ├── property-estimator/     # App 1 展示组件
│   └── market-analysis/        # App 2 展示组件
└── features/
    ├── property-estimator/
    │   ├── hooks/              # useEstimatorDashboard
    │   ├── __tests__/          # 业务域测试
    │   ├── api.ts              # 浏览器侧 API 调用封装
    │   ├── server-api.ts       # Next.js API Proxy 服务端调用封装
    │   ├── schemas.ts          # Zod 表单/数据校验
    │   ├── formatting.ts       # 展示格式化
    │   └── types.ts            # 领域类型
    └── market-analysis/
        ├── hooks/              # useMarketDashboard
        ├── __tests__/          # 业务域测试
        ├── api.ts              # 浏览器侧 API 调用封装
        ├── server-api.ts       # Next.js API Proxy 服务端调用封装
        ├── schemas.ts          # Zod 表单/筛选校验
        ├── formatting.ts       # 展示格式化
        ├── export.ts           # CSV / PDF 导出工具
        └── types.ts            # 领域类型
```

**架构说明：**
- 采用 feature-based architecture：业务域代码按 `features/property-estimator` 和 `features/market-analysis` 聚合。
- `components/` 只保留 UI 展示组件；表单、图表、表格等组件不直接承担跨模块业务编排。
- Dashboard 状态和异步请求流程抽离到自定义 Hooks：`useEstimatorDashboard`、`useMarketDashboard`。
- API 通信分层：浏览器侧调用 `features/*/api.ts`，Next.js API Proxy 复用 `features/*/server-api.ts`。
- 表单校验使用 React Hook Form + Zod；图表使用 Recharts。
- Market Analysis 表格支持搜索过滤、列排序、CSV 导出和浏览器打印/保存 PDF。
- App Router 提供路由级 `loading.tsx` 和 `error.tsx`，组件内部也保留细粒度 loading/error/empty 状态。

**状态管理：** 以业务域自定义 Hooks + 组件级 state 为主，无 Redux/Context。当前状态范围局部、数据来源明确，避免过度引入全局状态管理。

---

## 五、API 接口文档

### 5.1 ML API（端口 8000）

#### `GET /health`
```json
{ "status": "healthy", "model_loaded": true, "algorithm": "Ridge Regression" }
```

#### `POST /predict`
请求体（单条或数组）：
```json
{
  "square_footage": 2000, "bedrooms": 3, "bathrooms": 2.0,
  "year_built": 2010, "lot_size": 5000,
  "distance_to_city_center": 5.0, "school_rating": 8.0
}
```
响应：
```json
{
  "count": 1,
  "predictions": [{ "predicted_price": 450000.00 }],
  "algorithm": "Ridge Regression"
}
```

#### `GET /model-info`
返回算法名、管道步骤、特征列表、系数、截距、训练指标（MAE/RMSE/R²）、样本量。

---

### 5.2 Property Estimator API（端口 8001）

#### `GET /health`
返回服务状态和 ML API 连接地址。

#### `POST /estimates`
创建估价。请求体为 7 项房产特征。返回 `EstimateRecord`（id + features + predicted_price + created_at）。
- 错误：`502`（ML API 失败）、`504`（ML API 超时）

#### `GET /estimates?limit=20`
估价列表，返回 `{ items: EstimateRecord[] }`。

#### `GET /estimates/{estimate_id}`
估价详情。`404` 表示不存在。

#### `POST /comparisons`
请求体：`{ "estimate_ids": ["uuid-1", "uuid-2"] }`
响应：`{ items, highest_price, lowest_price, price_difference }`
- 错误：`404`（记录不存在）、`422`（校验失败）

---

### 5.3 Market Analysis API（端口 8002）

#### `GET /health`
返回服务状态和 ML API 连接地址。

#### `GET /summary`
返回全量市场统计：
```json
{
  "totalRecords": 500,
  "avgPrice": 450000.0, "medianPrice": 420000.0,
  "minPrice": 150000.0, "maxPrice": 950000.0,
  "avgSquareFootage": 2200.0, "avgPricePerSqft": 205.0,
  "priceBuckets": [{ "label": "200k-300k", "min": 200000, "max": 300000, "count": 45 }],
  "avgBedrooms": 3.2, "avgBathrooms": 2.1
}
```

#### `GET /segments?minBedrooms=3&maxBedrooms=4&minSchoolRating=7`
按维度筛选细分市场，返回各段统计 + 该段内房产记录列表。

#### `POST /what-if`
请求体为 7 项房产特征，返回：
```json
{
  "predictedPrice": 450000.0,
  "marketPosition": { "percentile": 65.0, "totalCompared": 500 },
  "nearestNeighbors": [{ "features": {...}, "price": 448000.0 }],
  "segmentStats": { "avgPrice": 430000.0, "medianPrice": 425000.0 }
}
```

---

### 5.4 Web Portal API 路由（端口 3000）

作为反向代理透传到 Property Estimator API（8001）和 Market Analysis API（8002），请求/响应格式与下游服务完全一致，Portal 仅做透传。

---

## 六、数据模型

### 6.1 核心模型

**PropertyFeatures（房产特征）：** square_footage(>0), bedrooms(≥0), bathrooms(≥0), year_built(1800-2100), lot_size(>0), distance_to_city_center(≥0), school_rating(0-10)

**EstimateRecord（估价记录）：** id(UUID), features(PropertyFeatures), predicted_price(float), created_at(ISO 8601)

**ComparisonResponse（对比结果）：** items(EstimateRecord[]), highest_price(float), lowest_price(float), price_difference(float)

### 6.2 市场分析模型

**StatisticSummary（统计摘要）：** totalRecords, avgPrice, medianPrice, minPrice, maxPrice, avgSquareFootage, avgPricePerSqft, avgBedrooms, avgBathrooms, priceBuckets

**PriceBucket（价格分桶）：** label, min, max, count

**MarketSegmentResponse（分段结果）：** segmentStats(StatisticSummary), records(PropertyRecord[])

**WhatIfResponse（What-if 结果）：** predictedPrice, marketPosition(percentile, totalCompared), nearestNeighbors(PropertyRecord[]), segmentStats(StatisticSummary)

**PropertyRecord（市场房产记录）：** 7 项特征 + price

---

## 七、配置与环境变量

### 7.1 Property Estimator API（`apps/property-estimator-api/app/config.py`）

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `ML_API_BASE_URL` | `http://localhost:8000` | ML API 地址 |
| `ML_API_TIMEOUT_SECONDS` | `5.0` | 请求超时秒数 |

使用 pydantic-settings，支持 `.env` 文件。

### 7.2 ML API（`apps/ml-api/app/config.py`）

无环境变量，所有配置硬编码：
- 特征列：`["square_footage", "bedrooms", "bathrooms", "year_built", "lot_size", "distance_to_city_center", "school_rating"]`
- 目标列：`price`
- 模型：Ridge(alpha=1.0)
- 训练/测试分割：test_size=0.2, random_state=42
- 模型文件：`models/ridge_model.joblib`
- 指标文件：`models/metrics.json`

### 7.3 Market Analysis API（`application.yml`）

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `MARKET_DATA_WORKBOOK_PATH` | `../ml-api/data/House Price Dataset...` | Excel 数据路径 |
| `ML_API_BASE_URL` | `http://localhost:8000` | ML API 地址 |

### 7.4 Web Portal

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `PROPERTY_ESTIMATOR_API_BASE_URL` | `http://localhost:8001` | 估价 API 地址 |
| `MARKET_ANALYSIS_API_BASE_URL` | `http://localhost:8002` | 市场分析 API 地址 |

---

## 八、错误处理

### 8.1 Property Estimator API 异常体系

```
Exception
├── EstimateNotFoundError        → HTTP 404
├── ComparisonValidationError    → HTTP 422
└── MlApiError (ml_client.py)
    ├── MlApiTimeoutError        → HTTP 504
    ├── MlApiConnectionError     → HTTP 502
    └── MlApiResponseError       → HTTP 502
```

### 8.2 ML API

- 校验错误：422 + detail 消息
- 内部错误：500 + 通用错误消息

### 8.3 前端（`features/*/server-api.ts` + App Router Error Boundary）

- `DOMException(AbortError)` → 504 timeout
- 其他 fetch 异常 → 502
- 响应中携带 JSON detail 消息
- `app/error.tsx` 提供路由级异常兜底和重试入口
- 组件内部使用 `error-state` 展示业务请求错误

---

## 九、测试

### 9.1 前端（Vitest + React Testing Library）

```
apps/web-portal/
├── vitest.config.ts           # jsdom, globals, include app/features 测试
├── app/__tests__/             # App Shell / 路由层测试
└── features/
    ├── property-estimator/__tests__/ # App 1 API、schema、formatting、dashboard 测试
    └── market-analysis/__tests__/    # App 2 API、schema、formatting、dashboard 测试
```

运行：`npm run test`

### 9.2 Property Estimator API（pytest）

```
apps/property-estimator-api/tests/
├── test_service.py      # 业务逻辑测试
├── test_repository.py   # 内存存储测试
├── test_api.py          # API 端点测试
├── test_ml_client.py    # ML 客户端测试
└── test_schemas.py      # 数据模型测试
```

运行：`pytest -v`

### 9.3 ML API（pytest）

```
apps/ml-api/tests/
├── test_training.py      # 训练管道测试
├── test_model_service.py # 模型服务测试
├── test_api.py           # API 端点测试
└── test_schemas.py       # 数据模型测试
```

运行：`pytest -v`

### 9.4 Market Analysis API（JUnit + Mockito + MockWebServer）

```
apps/market-analysis-api/src/test/java/
├── DatasetLoaderTest.java
├── MarketAnalysisServiceTest.java
├── MlApiClientTest.java
├── StatisticsCalculatorTest.java
└── MarketAnalysisControllerTest.java
```

运行：`mvn test`

---

## 十、训练数据与模型

### 10.1 数据集

- 文件：`apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx`
- 两个 Sheet：
  - `Test Data For Prediction` — 训练数据
  - `House Price Dataset` — 市场分析/预测数据
- 7 个特征列 + 1 个目标列 `price`

### 10.2 训练管道

- 预处理：StandardScaler 标准化
- 算法：Ridge 回归 (alpha=1.0)
- 训练/测试分割：80/20 (random_state=42)
- 输出文件：
  - `models/ridge_model.joblib` — 模型文件
  - `models/metrics.json` — 训练指标（MAE, RMSE, R²）
- 触发时机：服务启动时自动检测，模型缺失则自动训练
- 手动触发：`python -m app.training`

---

## 十一、Docker 部署

### 11.1 ML API

```bash
cd apps/ml-api
docker build -t house-price-ml-api .
docker run --rm -p 8000:8000 house-price-ml-api
```

### 11.2 Property Estimator API

```bash
cd apps/property-estimator-api
docker build -t property-estimator-api .
docker run --rm -p 8001:8001 \
  -e ML_API_BASE_URL=http://host.docker.internal:8000 \
  property-estimator-api
```

### 11.3 说明

- 两个 Python 服务基于 `python:3.12-slim` 镜像
- 暂无 Docker Compose 编排文件（README 注明为后续计划）
- Market Analysis API 和 Web Portal 暂无 Dockerfile

---

## 十二、本地启动

```bash
# 终端 1 — ML API
cd apps/ml-api && source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000

# 终端 2 — Property Estimator API
cd apps/property-estimator-api && source .venv/bin/activate
ML_API_BASE_URL=http://localhost:8000 uvicorn app.main:app --host 127.0.0.1 --port 8001

# 终端 3 — Market Analysis API
cd apps/market-analysis-api
ML_API_BASE_URL=http://localhost:8000 mvn spring-boot:run

# 终端 4 — Web Portal
cd apps/web-portal
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001 \
MARKET_ANALYSIS_API_BASE_URL=http://localhost:8002 \
npm run dev
```

访问 http://localhost:3000

---

## 十三、类型系统

### 13.1 前端 TypeScript 类型（`features/*/types.ts`）

```typescript
// 共享类型
PropertyFeatures      // 7 项房产特征
EstimateRecord        // id, features, predicted_price, created_at
EstimateListResponse  // items: EstimateRecord[]
ComparisonResponse    // items, highest_price, lowest_price, price_difference
HealthResponse        // status, ml_api_url, model_loaded

// 市场分析类型
StatisticSummary      // 统计摘要
PriceBucket           // 价格分桶
PropertyRecord        // 房产记录
MarketSegmentResponse // 分段结果
WhatIfResponse        // What-if 结果
MarketPosition        // 市场定位（percentile, totalCompared）
```

### 13.2 后端类型

- **Python：** FastAPI + Pydantic 模型，全量类型注解，运行时校验
- **Java：** Spring Boot + DTO 类，编译时类型安全

---

## 十四、设计特点

- **四层分离：** ML 推理 → 业务编排 → 市场分析 → UI 展示，独立部署
- **Protocol 依赖注入：** 服务依赖接口而非具体实现，便于测试
- **线程安全：** RLock 保护内存存储并发访问
- **优雅错误处理：** 异常层级清晰，HTTP 状态码逐层映射，前端可感知
- **全链路类型安全：** 前端 TypeScript + Zod，后端 Pydantic / Java DTO
- **环境配置：** 环境变量注入服务地址，适配不同部署环境
- **自动训练：** ML 服务启动时自动检测并训练模型，零手动干预
- **缓存策略：** 市场分析 API 使用 Spring Cache 加速汇总查询

---

## 十五、待完善项

| 项目 | 状态 | 说明 |
|------|------|------|
| 持久化存储 | 未实现 | 当前使用内存存储，重启丢失 |
| Docker Compose | 未实现 | README 注明后续计划 |
| CI/CD | 未配置 | 无 GitHub Actions 等流水线 |
| 日志/监控 | 未实现 | 依赖 stdout/stderr |
| 认证授权 | 未实现 | 所有接口无鉴权 |
| Market Analysis Dockerfile | 未实现 | 仅 Python 服务有 Dockerfile |
