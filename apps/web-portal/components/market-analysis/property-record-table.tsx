"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatNumber } from "@/features/market-analysis/formatting";
import {
  downloadPropertyRecordsCsv,
  printMarketRecordsAsPdf
} from "@/features/market-analysis/export";
import type { PropertyRecord } from "@/features/market-analysis/types";

type PropertyRecordTableProps = {
  records: PropertyRecord[];
  title: string;
  emptyMessage: string;
};

type SortKey =
  | "id"
  | "price"
  | "square_footage"
  | "bedrooms"
  | "bathrooms"
  | "school_rating"
  | "distance_to_city_center";

type SortDirection = "asc" | "desc";

const sortableColumns: Array<{
  key: SortKey;
  label: string;
  align?: "right";
}> = [
  { key: "id", label: "ID" },
  { key: "price", label: "Price", align: "right" },
  { key: "square_footage", label: "Sq ft", align: "right" },
  { key: "bedrooms", label: "Beds", align: "right" },
  { key: "bathrooms", label: "Baths", align: "right" },
  { key: "school_rating", label: "School", align: "right" },
  { key: "distance_to_city_center", label: "City distance", align: "right" }
];

export function PropertyRecordTable({
  records,
  title,
  emptyMessage
}: PropertyRecordTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredRecords =
      normalizedQuery.length === 0
        ? records
        : records.filter((record) =>
            [
              record.id,
              record.price,
              record.square_footage,
              record.bedrooms,
              record.bathrooms,
              record.school_rating,
              record.distance_to_city_center
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          );

    return [...filteredRecords].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (typeof leftValue === "string" || typeof rightValue === "string") {
        return String(leftValue).localeCompare(String(rightValue)) * directionFactor;
      }

      return (Number(leftValue) - Number(rightValue)) * directionFactor;
    });
  }, [query, records, sortDirection, sortKey]);

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "id" ? "asc" : "desc");
  }

  function handleDownloadCsv() {
    downloadPropertyRecordsCsv(visibleRecords, `${title.toLowerCase().replaceAll(" ", "-")}.csv`);
  }

  return (
    <section className="surface-card p-5">
      <div className="section-header">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="section-copy">
            Sort, filter, and export the currently visible market records.
          </p>
        </div>
        <div className="data-toolbar">
          <button
            className="btn-secondary"
            disabled={visibleRecords.length === 0}
            type="button"
            onClick={handleDownloadCsv}
          >
            Export CSV
          </button>
          <button
            className="btn-secondary"
            disabled={visibleRecords.length === 0}
            type="button"
            onClick={printMarketRecordsAsPdf}
          >
            Export PDF
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="empty-state mt-4">{emptyMessage}</p>
      ) : (
        <>
          <label className="mt-4 block max-w-sm">
            <span className="text-sm font-medium text-slate-700">
              Filter records
            </span>
            <input
              className="input mt-1"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, price, beds, school rating..."
            />
          </label>

          {visibleRecords.length === 0 ? (
            <p className="empty-state mt-4">
              No records match this table filter.
            </p>
          ) : (
            <div className="table-wrap mt-4">
              <table className="data-table">
                <thead>
                  <tr>
                    {sortableColumns.map((column) => (
                      <th
                        className={column.align === "right" ? "text-right" : undefined}
                        key={column.key}
                        aria-sort={
                          sortKey === column.key
                            ? sortDirection === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          className="table-sort-button"
                          type="button"
                          onClick={() => handleSort(column.key)}
                        >
                          <span>{column.label}</span>
                          <span aria-hidden="true">
                            {sortKey === column.key
                              ? sortDirection === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td className="text-right font-semibold text-slate-950">
                        {formatCurrency(record.price)}
                      </td>
                      <td className="text-right">{formatNumber(record.square_footage)}</td>
                      <td className="text-right">{record.bedrooms}</td>
                      <td className="text-right">{record.bathrooms}</td>
                      <td className="text-right">{formatNumber(record.school_rating)}</td>
                      <td className="text-right">
                        {formatNumber(record.distance_to_city_center)} mi
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
