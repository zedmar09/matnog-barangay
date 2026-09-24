"use client";

import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import styles from "@/features/resident-registry/components/resident-registry.module.css";

const markerIcon = divIcon({
  className: "",
  html: '<div style="display:grid;place-items:center;width:38px;height:38px;border:4px solid white;border-radius:50% 50% 50% 0;background:#0f9185;color:white;box-shadow:0 4px 14px rgba(10,69,63,.32);transform:rotate(-45deg)"><span style="display:block;width:9px;height:9px;border:2px solid white;border-radius:50%;transform:rotate(45deg)"></span></div>',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

export function StructureLocationMap({
  latitude,
  longitude,
  structureCode,
  address,
}: {
  latitude: number;
  longitude: number;
  structureCode: string;
  address: string;
}) {
  const position: [number, number] = [latitude, longitude];

  return (
    <MapContainer
      className={styles.leafletMap}
      center={position}
      zoom={17}
      scrollWheelZoom
      aria-label={`Map showing ${structureCode}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={markerIcon}>
        <Popup>
          <strong>{structureCode}</strong>
          <br />
          {address}
          <br />
          <small>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </small>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
