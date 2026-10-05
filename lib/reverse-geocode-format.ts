export type NominatimAddress = {
  amenity?: string;
  cafe?: string;
  restaurant?: string;
  shop?: string;
  tourism?: string;
  building?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
};

export type ReverseGeocodeResult = {
  primaryLine: string;
  secondaryLine: string;
  locationText: string;
};

/** Turn Nominatim reverse response into display lines for the form. */
export function formatReverseGeocode(
  displayName: string | undefined,
  address: NominatimAddress | undefined,
  latitude: number,
  longitude: number
): ReverseGeocodeResult {
  const placeName =
    address?.amenity ||
    address?.cafe ||
    address?.restaurant ||
    address?.shop ||
    address?.tourism ||
    address?.building ||
    address?.road ||
    "Selected location";

  const areaParts = [
    address?.neighbourhood,
    address?.suburb,
    address?.village,
    address?.town,
    address?.city,
    address?.county,
    address?.state,
  ].filter(Boolean);

  const secondaryLine =
    areaParts.length > 0
      ? [...new Set(areaParts)].slice(0, 3).join(", ")
      : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  const locationText =
    displayName?.trim() ||
    (secondaryLine && placeName !== "Selected location"
      ? `${placeName}, ${secondaryLine}`
      : placeName);

  return {
    primaryLine: placeName,
    secondaryLine,
    locationText,
  };
}
