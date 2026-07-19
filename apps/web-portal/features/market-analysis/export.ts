import type { PropertyRecord } from "./types";

type CsvColumn<T> = {
  header: string;
  value: (item: T) => string | number;
};

export function downloadPropertyRecordsCsv(records: PropertyRecord[], filename: string) {
  const columns: Array<CsvColumn<PropertyRecord>> = [
    { header: "ID", value: (record) => record.id },
    { header: "Price", value: (record) => record.price },
    { header: "Square footage", value: (record) => record.square_footage },
    { header: "Bedrooms", value: (record) => record.bedrooms },
    { header: "Bathrooms", value: (record) => record.bathrooms },
    { header: "Year built", value: (record) => record.year_built },
    { header: "Lot size", value: (record) => record.lot_size },
    {
      header: "Distance to city center",
      value: (record) => record.distance_to_city_center
    },
    { header: "School rating", value: (record) => record.school_rating }
  ];

  const csvRows = [
    columns.map((column) => escapeCsvCell(column.header)).join(","),
    ...records.map((record) =>
      columns.map((column) => escapeCsvCell(column.value(record))).join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8"
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function printMarketRecordsAsPdf() {
  window.print();
}

function escapeCsvCell(value: string | number) {
  const stringValue = String(value);
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}
