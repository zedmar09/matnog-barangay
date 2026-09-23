"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, MapPin, Save } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import type { HouseholdStructureInput } from "../types/household";

const materials = ["Concrete", "Mixed concrete and wood", "Wood", "Light materials"];
const tenures = ["Owned", "Rented", "Rent-free with consent", "Informal occupancy"];
const waterSources = ["Level III connection", "Community faucet", "Deep well", "Spring / protected source"];
const toiletFacilities = ["Water-sealed private", "Water-sealed shared", "Pit latrine", "None reported"];
const powerSources = ["Electric cooperative", "Solar", "Generator", "No regular connection"];
const wasteMethods = ["Barangay collection", "Municipal collection", "Composting", "Community disposal point"];

export function StructureFormView({ id }: { id?: string }) {
  const current = useHouseholdRegistryStore((state) =>
    id ? state.structures.find((item) => item.id === id) : undefined,
  );
  const addStructure = useHouseholdRegistryStore((state) => state.addStructure);
  const updateStructure = useHouseholdRegistryStore((state) => state.updateStructure);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [data, setData] = useState<HouseholdStructureInput>(
    current
      ? {
          barangayId: current.barangayId,
          purok: current.purok,
          sitio: current.sitio,
          zone: current.zone,
          street: current.street,
          houseNumber: current.houseNumber,
          latitude: current.latitude,
          longitude: current.longitude,
          dwelling: { ...current.dwelling },
        }
      : {
          barangayId: selectedBarangay === "all" ? "" : selectedBarangay,
          purok: "",
          sitio: "",
          zone: "",
          street: "",
          houseNumber: "",
          latitude: 12.585,
          longitude: 124.081,
          dwelling: {
            constructionMaterial: "",
            tenure: "",
            waterSource: "",
            toiletFacility: "",
            powerSource: "",
            wasteDisposal: "",
            internetAccess: "",
          },
        },
  );
  const [error, setError] = useState("");
  const set = <K extends keyof HouseholdStructureInput>(key: K, value: HouseholdStructureInput[K]) =>
    setData((currentData) => ({ ...currentData, [key]: value }));
  const setDwelling = (key: keyof HouseholdStructureInput["dwelling"], value: string) =>
    setData((currentData) => ({ ...currentData, dwelling: { ...currentData.dwelling, [key]: value } }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !data.barangayId ||
      !data.purok ||
      !data.street ||
      !data.houseNumber ||
      !data.latitude ||
      !data.longitude ||
      Object.values(data.dwelling).some((value) => !value)
    ) {
      setError("Complete the normalized address, GPS coordinates, and dwelling profile.");
      return;
    }
    if (data.latitude < 12.4 || data.latitude > 12.9 || data.longitude < 123.8 || data.longitude > 124.4) {
      setError("GPS coordinates must fall within the expected Matnog area for this prototype.");
      return;
    }
    const structure = id ? updateStructure(id, data) : addStructure(data);
    if (structure) router.push(`/barangay-affairs/structures/${structure.id}?saved=1`);
  };
  if (id && !current)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <MapPin size={34} />
          <h1>Structure not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/structures">
            Return to inventory
          </Link>
        </div>
      </div>
    );

  return (
    <div className={`${styles.page} ${styles.formShell}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Structures & Addresses</p>
          <h1>{id ? "Edit structure" : "Register structure"}</h1>
          <p>Use the municipal hierarchy and one GPS point for the physical dwelling.</p>
        </div>
        <Link
          className={styles.secondaryButton}
          href={id ? `/barangay-affairs/structures/${id}` : "/barangay-affairs/structures"}
        >
          <ArrowLeft size={15} /> {id ? "Structure" : "Inventory"}
        </Link>
      </header>
      {error ? <div className={`${styles.toast} ${styles.error}`}>{error}</div> : null}
      <form onSubmit={submit}>
        <section className={styles.card}>
          <div className={styles.formBody}>
            <h2 className={styles.sectionTitle}>Normalized municipal address</h2>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Barangay *</span>
                <select value={data.barangayId} onChange={(event) => set("barangayId", event.target.value)}>
                  <option value="">Select barangay</option>
                  {MATNOG_BARANGAYS.map((barangay) => (
                    <option key={barangay.code} value={barangay.code}>
                      {barangay.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Purok *</span>
                <input value={data.purok} onChange={(event) => set("purok", event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Sitio</span>
                <input value={data.sitio} onChange={(event) => set("sitio", event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Zone</span>
                <input value={data.zone} onChange={(event) => set("zone", event.target.value)} />
              </label>
              <label className={`${styles.field} ${styles.span2}`}>
                <span>Street / road *</span>
                <input value={data.street} onChange={(event) => set("street", event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>House number *</span>
                <input value={data.houseNumber} onChange={(event) => set("houseNumber", event.target.value)} />
              </label>
            </div>
            <h2 className={styles.sectionTitle}>GPS location</h2>
            <div className={styles.gpsEntry}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Latitude *</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={data.latitude}
                    onChange={(event) => set("latitude", Number(event.target.value))}
                  />
                </label>
                <label className={styles.field}>
                  <span>Longitude *</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={data.longitude}
                    onChange={(event) => set("longitude", Number(event.target.value))}
                  />
                </label>
              </div>
              <div className={styles.coordinatePreview}>
                <MapPin size={22} />
                <div>
                  <strong>Structure coordinate</strong>
                  <span>
                    {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
            <h2 className={styles.sectionTitle}>Dwelling and utility profile</h2>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Construction material *</span>
                <select
                  value={data.dwelling.constructionMaterial}
                  onChange={(event) => setDwelling("constructionMaterial", event.target.value)}
                >
                  <option value="">Select material</option>
                  {materials.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Tenure *</span>
                <select value={data.dwelling.tenure} onChange={(event) => setDwelling("tenure", event.target.value)}>
                  <option value="">Select tenure</option>
                  {tenures.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Water source *</span>
                <select
                  value={data.dwelling.waterSource}
                  onChange={(event) => setDwelling("waterSource", event.target.value)}
                >
                  <option value="">Select water source</option>
                  {waterSources.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Toilet facility *</span>
                <select
                  value={data.dwelling.toiletFacility}
                  onChange={(event) => setDwelling("toiletFacility", event.target.value)}
                >
                  <option value="">Select facility</option>
                  {toiletFacilities.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Power source *</span>
                <select
                  value={data.dwelling.powerSource}
                  onChange={(event) => setDwelling("powerSource", event.target.value)}
                >
                  <option value="">Select power source</option>
                  {powerSources.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Waste disposal *</span>
                <select
                  value={data.dwelling.wasteDisposal}
                  onChange={(event) => setDwelling("wasteDisposal", event.target.value)}
                >
                  <option value="">Select method</option>
                  {wasteMethods.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Internet access *</span>
                <select
                  value={data.dwelling.internetAccess}
                  onChange={(event) => setDwelling("internetAccess", event.target.value)}
                >
                  <option value="">Select access</option>
                  {["Fixed broadband", "Mobile data", "Community access", "None"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>
        <div className={styles.formActions}>
          <Link
            className={styles.secondaryButton}
            href={id ? `/barangay-affairs/structures/${id}` : "/barangay-affairs/structures"}
          >
            Cancel
          </Link>
          <button className={styles.primaryButton} type="submit">
            <Save size={15} /> Save structure
          </button>
        </div>
      </form>
    </div>
  );
}
