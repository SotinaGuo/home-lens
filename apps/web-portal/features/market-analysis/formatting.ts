export const marketFieldLabels = {
  square_footage: "Square footage",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  year_built: "Year built",
  lot_size: "Lot size",
  distance_to_city_center: "Distance to city center",
  school_rating: "School rating",
  price: "Price"
} as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}
