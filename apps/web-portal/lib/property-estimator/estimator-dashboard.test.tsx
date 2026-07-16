import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EstimatorDashboard } from "@/components/property-estimator/estimator-dashboard";
import { compareEstimates, createEstimate, listEstimates } from "./api";
import type { ComparisonResponse, EstimateRecord } from "./types";

vi.mock("./api", () => ({
  compareEstimates: vi.fn(),
  createEstimate: vi.fn(),
  listEstimates: vi.fn()
}));

vi.mock("recharts", () => ({
  Bar: () => null,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null
}));

const baseEstimate: EstimateRecord = {
  id: "estimate-1",
  features: {
    square_footage: 1550,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 1997,
    lot_size: 6800,
    distance_to_city_center: 4.1,
    school_rating: 7.6
  },
  predicted_price: 250000,
  created_at: "2026-07-16T01:30:00.000Z"
};

const secondEstimate: EstimateRecord = {
  ...baseEstimate,
  id: "estimate-2",
  features: {
    ...baseEstimate.features,
    bedrooms: 4,
    square_footage: 2200
  },
  predicted_price: 325000,
  created_at: "2026-07-16T01:45:00.000Z"
};

const comparison: ComparisonResponse = {
  items: [baseEstimate, secondEstimate],
  highest_price: secondEstimate.predicted_price,
  lowest_price: baseEstimate.predicted_price,
  price_difference: secondEstimate.predicted_price - baseEstimate.predicted_price
};

describe("EstimatorDashboard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("clears a rendered comparison when the selected history records change", async () => {
    vi.mocked(listEstimates).mockResolvedValue({
      items: [baseEstimate, secondEstimate]
    });
    vi.mocked(compareEstimates).mockResolvedValue(comparison);
    vi.mocked(createEstimate).mockResolvedValue(baseEstimate);

    render(<EstimatorDashboard />);

    const checkboxes = await screen.findAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const compareButton = screen.getByRole("button", { name: "Compare selected" });
    expect(compareButton).toHaveProperty("disabled", false);

    fireEvent.click(compareButton);

    await screen.findByText("Highest price");

    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(screen.queryByText("Highest price")).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Compare selected" })).toHaveProperty(
      "disabled",
      true
    );
  });

  it("does not render a stale comparison when selection changes before the request resolves", async () => {
    let resolveComparison: (response: ComparisonResponse) => void = () => {
      throw new Error("Comparison promise resolver was not initialized");
    };
    const pendingComparison = new Promise<ComparisonResponse>((resolve) => {
      resolveComparison = resolve;
    });

    vi.mocked(listEstimates).mockResolvedValue({
      items: [baseEstimate, secondEstimate]
    });
    vi.mocked(compareEstimates).mockReturnValue(pendingComparison);
    vi.mocked(createEstimate).mockResolvedValue(baseEstimate);

    render(<EstimatorDashboard />);

    const checkboxes = await screen.findAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const compareButton = screen.getByRole("button", { name: "Compare selected" });
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(compareEstimates).toHaveBeenCalledWith({
        estimate_ids: ["estimate-1", "estimate-2"]
      });
    });

    fireEvent.click(checkboxes[0]);

    await act(async () => {
      resolveComparison(comparison);
      await pendingComparison;
    });

    expect(screen.queryByText("Highest price")).toBeNull();
    expect(screen.getByRole("button", { name: "Compare selected" })).toHaveProperty(
      "disabled",
      true
    );
  });
});
