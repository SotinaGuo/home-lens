import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarketDashboard } from "@/components/market-analysis/market-dashboard";
import * as api from "./api";

vi.mock("recharts", () => ({
  Bar: () => null,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null
}));

const statistic = {
  average: 250000,
  median: 245000,
  minimum: 150000,
  maximum: 400000
};

const summary = {
  record_count: 50,
  price: statistic,
  square_footage: statistic,
  bedrooms: statistic,
  bathrooms: statistic,
  school_rating: statistic,
  distance_to_city_center: statistic,
  price_buckets: [{ label: "$200k-$300k", count: 12 }]
};

describe("MarketDashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads health and summary on initial render", async () => {
    vi.spyOn(api, "getMarketHealth").mockResolvedValue({
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    });
    vi.spyOn(api, "getMarketSummary").mockResolvedValue(summary);

    render(<MarketDashboard />);

    expect(await screen.findByText("Online")).toBeTruthy();
    expect(screen.getByText("$250,000")).toBeTruthy();
  });

  it("shows a clear error when initial market data cannot load", async () => {
    vi.spyOn(api, "getMarketHealth").mockRejectedValue(
      new Error("Market analysis backend is unavailable")
    );
    vi.spyOn(api, "getMarketSummary").mockRejectedValue(
      new Error("Market analysis backend is unavailable")
    );

    render(<MarketDashboard />);

    expect(await screen.findByText("Market analysis backend is unavailable")).toBeTruthy();
  });

  it("submits segment filters and renders matching record count", async () => {
    vi.spyOn(api, "getMarketHealth").mockResolvedValue({
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    });
    vi.spyOn(api, "getMarketSummary").mockResolvedValue(summary);
    vi.spyOn(api, "getMarketSegments").mockResolvedValue({
      filters: { minBedrooms: 3 },
      record_count: 8,
      statistics: summary,
      records: []
    });

    render(<MarketDashboard />);

    await screen.findByText("Online");
    fireEvent.change(screen.getByLabelText("Min bedrooms"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(await screen.findByText("8")).toBeTruthy();
  });

  it("renders zero-record segment responses with null statistics", async () => {
    vi.spyOn(api, "getMarketHealth").mockResolvedValue({
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    });
    vi.spyOn(api, "getMarketSummary").mockResolvedValue(summary);
    vi.spyOn(api, "getMarketSegments").mockResolvedValue({
      filters: { minBedrooms: 99 },
      record_count: 0,
      statistics: null,
      records: []
    });

    render(<MarketDashboard />);

    await screen.findByText("Online");
    fireEvent.change(screen.getByLabelText("Min bedrooms"), { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(await screen.findByText("0")).toBeTruthy();
    expect(screen.getByText("No matching records for these filters.")).toBeTruthy();
  });

  it("submits what-if values and renders predicted price", async () => {
    vi.spyOn(api, "getMarketHealth").mockResolvedValue({
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    });
    vi.spyOn(api, "getMarketSummary").mockResolvedValue(summary);
    vi.spyOn(api, "runWhatIf").mockResolvedValue({
      predicted_price: 275000,
      market_position: {
        percentile: 64.3,
        above_market_average: true,
        difference_from_average: 25000
      },
      nearest_records: []
    });

    render(<MarketDashboard />);

    await screen.findByText("Online");
    fireEvent.click(screen.getByRole("button", { name: "Run what-if analysis" }));

    expect(await screen.findByText("$275,000")).toBeTruthy();
  });
});
