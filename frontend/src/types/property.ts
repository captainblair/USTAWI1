export type Neighborhood = {
  id: string;
  name: string;
  slug: string;
  city: string;
  description?: string;
};

export type Amenity = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
};

export type PropertyListItem = {
  id: string;
  title: string;
  slug: string;
  property_type: string;
  status: string;
  neighborhood: Neighborhood | null;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price_monthly: string;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  safety_score: string;
  is_verified: boolean;
  is_featured: boolean;
  amenities: Amenity[];
  primary_image: string | null;
  landlord_name: string;
  published_at: string | null;
};

export type PropertyDetail = PropertyListItem & {
  description: string;
  images: Array<{
    id: string;
    image: string;
    caption: string;
    is_primary: boolean;
  }>;
  owner: {
    id: string;
    full_name: string;
    is_phone_verified: boolean;
    is_verified_landlord: boolean;
  };
  is_saved: boolean;
  virtual_tour_url?: string;
  views_count?: number;
};

export type FilterMetadata = {
  cities: string[];
  neighborhoods: Array<{ name: string; slug: string; city: string }>;
  property_types: Array<{ value: string; label: string }>;
  price_range: { min: number; max: number };
  safety_score_range?: { min: number; max: number };
  amenities: Amenity[];
  suggestions_when_empty?: string[];
};

export type SavedProperty = {
  id: string;
  property: PropertyListItem;
  created_at: string;
};

export type PropertySearchParams = {
  q?: string;
  city?: string;
  neighborhood?: string;
  min_price?: string;
  max_price?: string;
  min_beds?: string;
  max_beds?: string;
  min_baths?: string;
  property_type?: string;
  min_safety_score?: string;
  amenities?: string;
  ordering?: string;
  page?: string;
  /** Centre latitude for radius search (km) */
  lat?: string;
  lng?: string;
  radius?: string;
  /** min_lng,min_lat,max_lng,max_lat */
  bbox?: string;
};
