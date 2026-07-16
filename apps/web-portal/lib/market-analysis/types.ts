export type StatisticSummary = {
  average: number;
  median: number;
  minimum: number;
  maximum: number;
};

export type PriceBucket = {
  label: string;
  count: number;
};

export type MarketSummaryResponse = {
  record_count: number;
  price: StatisticSummary;
  square_footage: StatisticSummary;
  bedrooms: StatisticSummary;
  bathrooms: StatisticSummary;
  school_rating: StatisticSummary;
  distance_to_city_center: StatisticSummary;
  price_buckets: PriceBucket[];
};

export type MarketFilters = {
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minSchoolRating?: number;
  maxDistanceToCityCenter?: number;
};

export type PropertyFeatures = {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
};

export type PropertyRecord = PropertyFeatures & {
  id: number;
  price: number;
};

export type MarketSegmentResponse = {
  filters: MarketFilters;
  record_count: number;
  statistics: MarketSummaryResponse;
  records: PropertyRecord[];
};

export type MarketHealthResponse = {
  status: string;
  service: string;
  records_loaded: number;
  ml_api_base_url: string;
};

export type MarketPosition = {
  percentile: number;
  above_market_average: boolean;
  difference_from_average: number;
};

export type WhatIfResponse = {
  predicted_price: number;
  market_position: MarketPosition;
  nearest_records: PropertyRecord[];
};

export type ApiErrorResponse = {
  detail: string;
};
