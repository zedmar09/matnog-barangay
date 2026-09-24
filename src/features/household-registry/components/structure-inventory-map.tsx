"use client";

import { useEffect } from "react";

import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import styles from "@/features/resident-registry/components/resident-registry.module.css";

export type StructureMapEntry = {
  id: string;
  structureCode: string;
  address: string;
  latitude: number;
  longitude: number;
  householdCount: number;
  residentCount: number;
};

function markerIcon(shared: boolean, selected: boolean) {
  const color = shared ? "#e79227" : "#168f84";
  const size = selected ? 42 : 34;
  const border = selected ? 5 : 4;

  return divIcon({
    className: "",
    html: `<div style="display:grid;place-items:center;width:${size}px;height:${size}px;border:${border}px solid white;border-radius:50% 50% 50% 0;background:${color};box-shadow:0 4px 14px rgba(10,69,63,.32);transform:rotate(-45deg)"><span style="display:block;width:8px;height:8px;border:2px solid white;border-radius:2px;transform:rotate(45deg)"></span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FitVisibleStructures({ entries }: { entries: StructureMapEntry[] }) {
  const map = useMap();

  useEffect(() => {
    if (entries.length === 0) return;
    if (entries.length === 1) {
      map.setView([entries[0].latitude, entries[0].longitude], 17);
      return;
    }

    map.fitBounds(latLngBounds(entries.map((entry) => [entry.latitude, entry.longitude] as [number, number])), {
      padding: [42, 42],
      maxZoom: 16,
    });
  }, [entries, map]);

  return null;
}

export function StructureInventoryMap({
  entries,
  selectedId,
  onSelect,
}: {
  entries: StructureMapEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const center: [number, number] = entries.length ? [entries[0].latitude, entries[0].longitude] : [12.584, 124.087];

  return (
    <MapContainer
      className={styles.structureInventoryMap}
      center={center}
      zoom={13}
      scrollWheelZoom
      aria-label="Interactive map of registered structures"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitVisibleStructures entries={entries} />
      {entries.map((entry) => (
        <Marker
          key={entry.id}
          position={[entry.latitude, entry.longitude]}
          icon={markerIcon(entry.householdCount > 1, entry.id === selectedId)}
          eventHandlers={{ click: () => onSelect(entry.id) }}
          title={`${entry.structureCode} · ${entry.householdCount} household${entry.householdCount === 1 ? "" : "s"}`}
        >
          <Popup>
            <strong>{entry.structureCode}</strong>
            <br />
            {entry.address}
            <br />
            <small>
              {entry.householdCount} household{entry.householdCount === 1 ? "" : "s"} · {entry.residentCount} resident
              {entry.residentCount === 1 ? "" : "s"}
            </small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
