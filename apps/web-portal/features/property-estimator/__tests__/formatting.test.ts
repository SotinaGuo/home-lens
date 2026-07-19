import { afterEach, describe, expect, it, vi } from "vitest";
import { featureLabels, formatCurrency, formatDateTime, formatNumber } from "../formatting";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("formatting helpers", () => {
  it("formats currency for predicted prices", () => {
    expect(formatCurrency(250829.56)).toBe("$250,829.56");
  });

  it("formats compact feature numbers", () => {
    expect(formatNumber(6800)).toBe("6,800");
  });

  it("formats timestamps through Intl.DateTimeFormat without timezone-sensitive assertions", () => {
    const format = vi.fn().mockReturnValue("Jul 16, 2026, 9:30 AM");
    const dateTimeFormatSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(() => ({ format } as unknown as Intl.DateTimeFormat));

    expect(formatDateTime("2026-07-16T01:30:00.000Z")).toBe("Jul 16, 2026, 9:30 AM");
    expect(dateTimeFormatSpy).toHaveBeenCalledWith("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });
    expect(format).toHaveBeenCalledTimes(1);
    expect((format.mock.calls[0]?.[0] as Date).toISOString()).toBe("2026-07-16T01:30:00.000Z");
  });

  it("exposes human-readable labels for all model fields", () => {
    expect(featureLabels.square_footage).toBe("Square footage");
    expect(featureLabels.distance_to_city_center).toBe("Distance to city center");
  });
});
