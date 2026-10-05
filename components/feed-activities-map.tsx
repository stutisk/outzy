"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getCategoryLabel } from "@/lib/categories";

export type FeedMapActivity = {
  id: string;
  title: string;
  city: string;
  category: string;
  activity_date: string;
  latitude: number;
  longitude: number;
};

type UserLocation = { latitude: number; longitude: number };

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;margin-left:-11px;margin-top:-22px;background:#0d9488;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 5px rgba(0,0,0,0.2)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function FitBounds({
  activities,
  userLocation,
}: {
  activities: FeedMapActivity[];
  userLocation: UserLocation | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = activities.map((a) => [
      a.latitude,
      a.longitude,
    ]);
    if (userLocation) {
      points.push([userLocation.latitude, userLocation.longitude]);
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0] as L.LatLngExpression, 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [activities, userLocation, map]);

  return null;
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;margin-left:-7px;margin-top:-7px;background:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export function FeedActivitiesMap({
  activities,
  userLocation,
}: {
  activities: FeedMapActivity[];
  userLocation: UserLocation | null;
}) {
  const center = useMemo((): [number, number] => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (activities.length > 0) {
      return [activities[0].latitude, activities[0].longitude];
    }
    return [28.6139, 77.209];
  }, [activities, userLocation]);

  if (activities.length === 0) {
    return (
      <div
        className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-stone-50/80 px-6 py-12 text-center"
      >
        <p className="text-3xl" aria-hidden>🗺️</p>
        <p className="mt-2 font-semibold text-stone-900">No upcoming pins yet</p>
        <p className="mt-1 max-w-sm text-sm text-stone-500">
          Upcoming activities with a map location will show here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={12}
        className="h-[min(55vh,420px)] w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds activities={activities} userLocation={userLocation} />
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}
        {activities.map((a) => (
          <Marker
            key={a.id}
            position={[a.latitude, a.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <p className="text-xs font-medium text-stone-500">
                {getCategoryLabel(a.category)}
              </p>
              <p className="font-semibold text-stone-900">{a.title}</p>
              <p className="text-xs text-stone-600">{a.city}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
