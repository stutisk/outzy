"use client";

import { useCallback, useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { AppModal } from "@/components/app-modal";

export type MapLocationConfirmPayload = {
  latitude: number;
  longitude: number;
  primaryLine: string;
  secondaryLine: string;
  locationText: string;
};

type LatLng = { lat: number; lng: number };

const DEFAULT_CENTER: LatLng = { lat: 28.6139, lng: 77.209 };
const DEFAULT_ZOOM = 12;

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;margin-left:-14px;margin-top:-28px;background:#0d9488;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapFlyTo({
  center,
  zoom,
  flySeq,
}: {
  center: LatLng;
  zoom: number;
  flySeq: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (flySeq === 0) return;
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
  }, [flySeq, center.lat, center.lng, zoom, map]);
  return null;
}

function MapClickPicker({
  onPositionChange,
}: {
  onPositionChange: (pos: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

type MapLocationPickerProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: MapLocationConfirmPayload) => void;
};

export function MapLocationPicker({
  open,
  onClose,
  onConfirm,
}: MapLocationPickerProps) {
  const [position, setPosition] = useState<LatLng>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [hasUserPicked, setHasUserPicked] = useState(false);
  const [flySeq, setFlySeq] = useState(0);

  useEffect(() => {
    if (!open) return;

    setPosition(DEFAULT_CENTER);
    setZoom(DEFAULT_ZOOM);
    setFlySeq(0);
    setGeoNotice(null);
    setMapError(null);
    setSearchQuery("");
    setSearchError(null);
    setConfirmError(null);
    setHasUserPicked(false);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoNotice(
        "Unable to use device location — move the map and tap to drop a pin."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setZoom(14);
        setHasUserPicked(true);
        setFlySeq((n) => n + 1);
      },
      () => {
        setGeoNotice(
          "Location access denied — move the map and tap to drop a pin."
        );
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 0 }
    );
  }, [open]);

  const handlePositionChange = useCallback((pos: LatLng) => {
    setPosition(pos);
    setHasUserPicked(true);
    setConfirmError(null);
  }, []);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        setSearchError("Search failed. Check your network and try again.");
        return;
      }
      const data = (await res.json()) as {
        latitude?: number | null;
        longitude?: number | null;
      };
      if (data.latitude == null || data.longitude == null) {
        setSearchError("No results — tap the map to set a pin instead.");
        return;
      }
      setPosition({ lat: data.latitude, lng: data.longitude });
      setZoom(15);
      setHasUserPicked(true);
      setFlySeq((n) => n + 1);
    } catch {
      setSearchError("Network error. Try again or pick on the map.");
    } finally {
      setSearching(false);
    }
  };

  const fallbackPayload = (lat: number, lng: number): MapLocationConfirmPayload => ({
    latitude: lat,
    longitude: lng,
    primaryLine: "Selected location",
    secondaryLine: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    locationText: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  });

  const handleConfirm = async () => {
    if (!hasUserPicked) {
      setConfirmError("Tap the map to choose a location, then confirm.");
      return;
    }

    setConfirming(true);
    setConfirmError(null);

    const { lat, lng } = position;

    try {
      const res = await fetch(
        `/api/reverse-geocode?lat=${lat}&lon=${lng}`
      );
      const data = (await res.json()) as {
        ok?: boolean;
        primaryLine?: string;
        secondaryLine?: string;
        locationText?: string;
        error?: string;
      };

      if (res.ok && data.primaryLine && data.locationText) {
        onConfirm({
          latitude: lat,
          longitude: lng,
          primaryLine: data.primaryLine,
          secondaryLine: data.secondaryLine ?? "",
          locationText: data.locationText,
        });
        onClose();
        return;
      }

      onConfirm(fallbackPayload(lat, lng));
      onClose();
    } catch {
      onConfirm(fallbackPayload(lat, lng));
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      size="lg"
      title="Select location on map"
      subtitle="Search, pan, or tap anywhere to drop a pin. Confirm when ready."
      contentClassName="px-4 py-3"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 rounded-full bg-coral py-2.5 text-sm font-bold text-white hover:bg-coral-hover disabled:opacity-60"
          >
            {confirming ? "Confirming…" : "Confirm location"}
          </button>
        </div>
      }
    >
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for a place (optional)"
              className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral-100"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="shrink-0 rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-200 disabled:opacity-60"
            >
              {searching ? "…" : "Search"}
            </button>
          </div>
          {searchError && (
            <p className="text-xs text-amber-800">{searchError}</p>
          )}
          {geoNotice && (
            <p className="text-xs text-amber-800">{geoNotice}</p>
          )}
          {mapError && (
            <p className="text-xs text-red-600">{mapError}</p>
          )}
          {confirmError && (
            <p className="text-xs text-red-600">{confirmError}</p>
          )}
        </div>

        <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-stone-200">
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={zoom}
            className="h-[min(50vh,320px)] w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                tileerror: () =>
                  setMapError(
                    "Map tiles failed to load. Check your network connection."
                  ),
              }}
            />
            <MapFlyTo center={position} zoom={zoom} flySeq={flySeq} />
            <MapClickPicker onPositionChange={handlePositionChange} />
            <Marker
              position={[position.lat, position.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target;
                  handlePositionChange({
                    lat: m.getLatLng().lat,
                    lng: m.getLatLng().lng,
                  });
                },
              }}
            />
          </MapContainer>
        </div>
    </AppModal>
  );
}
