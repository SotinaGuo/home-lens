export type PropertyFeatures = {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
};

export type EstimateRecord = {
  id: string;
  features: PropertyFeatures;
  predicted_price: number;
  created_at: string;
};

export type EstimateListResponse = {
  items: EstimateRecord[];
};

export type ComparisonRequest = {
  estimate_ids: string[];
};

export type ComparisonResponse = {
  items: EstimateRecord[];
  highest_price: number;
  lowest_price: number;
  price_difference: number;
};

export type HealthResponse = {
  status: string;
  service: string;
  ml_api_base_url: string;
};

export type ApiErrorResponse = {
  detail: string;
};
