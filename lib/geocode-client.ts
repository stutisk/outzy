export async function geocodeLocation(
  locationText: string
): Promise<{ latitude: number | null; longitude: number | null }> {
  try {
    const res = await fetch(
      `/api/geocode?q=${encodeURIComponent(locationText)}`
    );
    if (!res.ok) {
      return { latitude: null, longitude: null };
    }
    const data = (await res.json()) as {
      latitude?: number | null;
      longitude?: number | null;
    };
    return {
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };
  } catch {
    return { latitude: null, longitude: null };
  }
}
