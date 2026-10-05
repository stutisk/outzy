import { NextResponse } from "next/server";
import {
  formatReverseGeocode,
  type NominatimAddress,
} from "@/lib/reverse-geocode-format";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latParam = url.searchParams.get("lat");
  const lonParam = url.searchParams.get("lon");

  const latitude = latParam ? parseFloat(latParam) : NaN;
  const longitude = lonParam ? parseFloat(lonParam) : NaN;

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "json",
      addressdetails: "1",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
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
        { error: "Reverse geocoding unavailable", ok: false },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      display_name?: string;
      address?: NominatimAddress;
      error?: string;
    };

    if (data.error) {
      return NextResponse.json({
        ok: false,
        latitude,
        longitude,
        ...formatReverseGeocode(undefined, undefined, latitude, longitude),
      });
    }

    const formatted = formatReverseGeocode(
      data.display_name,
      data.address,
      latitude,
      longitude
    );

    return NextResponse.json({
      ok: true,
      latitude,
      longitude,
      displayName: data.display_name,
      ...formatted,
    });
  } catch (err) {
    console.error("Reverse geocode error:", err);
    return NextResponse.json(
      { error: "Reverse geocoding failed", ok: false },
      { status: 500 }
    );
  }
}
