import { NextResponse } from "next/server";

/**
 * Forward-geocode a place name to WGS84 coordinates (OpenStreetMap Nominatim).
 * Used when creating activities; no map UI or user GPS.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing location query" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "1",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "Outzy/1.0 (activity creation; contact: app)",
          Accept: "application/json",
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 }
      );
    }

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!results.length) {
      return NextResponse.json(
        { latitude: null, longitude: null },
        { status: 200 }
      );
    }

    const latitude = parseFloat(results[0].lat);
    const longitude = parseFloat(results[0].lon);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { latitude: null, longitude: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ latitude, longitude });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
