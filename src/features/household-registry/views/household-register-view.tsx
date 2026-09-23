"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Check, Home, Search, UsersRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress } from "../utils/household-utils";

const relationshipOptions = ["Spouse", "Child", "Parent", "Sibling", "Grandchild", "Other relative", "Non-relative"];

export function HouseholdRegisterView() {
  const residents = useResidentRegistryStore((state) => state.residents);
  const households = useHouseholdRegistryStore((state) => state.households);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const addHousehold = useHouseholdRegistryStore((state) => state.addHousehold);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [barangayId, setBarangayId] = useState(selectedBarangay === "all" ? "" : selectedBarangay);
  const [structureId, setStructureId] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [headId, setHeadId] = useState("");
  const [relationships, setRelationships] = useState<Record<string, string>>({});
  const [income, setIncome] = useState("");
  const [livelihood, setLivelihood] = useState("");
  const [foodSecurity, setFoodSecurity] = useState("");
  const [error, setError] = useState("");
  const assigned = useMemo(
    () =>
      new Set(
        households.flatMap((household) =>
          household.members.filter((member) => !member.leftAt).map((member) => member.residentId),
        ),
      ),
    [households],
  );
  const eligible = useMemo(
    () =>
      residents.filter(
        (resident) =>
          resident.residentStatus === "Active" &&
          resident.address.barangayId === barangayId &&
          !assigned.has(resident.id),
      ),
    [assigned, barangayId, residents],
  );
  const results = eligible
    .filter(
      (resident) =>
        !query.trim() ||
        `${resident.lrn} ${formatResidentName(resident)}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .slice(0, 12);
  const selectedResidents = selected
    .map((id) => residents.find((resident) => resident.id === id))
    .filter((resident): resident is NonNullable<typeof resident> => Boolean(resident));
  const availableStructures = structures.filter((structure) => structure.barangayId === barangayId);

  const toggle = (residentId: string) => {
    setSelected((current) =>
      current.includes(residentId) ? current.filter((id) => id !== residentId) : [...current, residentId],
    );
    if (selected.includes(residentId)) {
      if (headId === residentId) setHeadId("");
    } else if (!headId) setHeadId(residentId);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !barangayId ||
      !structureId ||
      !headId ||
      !selected.includes(headId) ||
      !selected.length ||
      !income ||
      !livelihood ||
      !foodSecurity
    ) {
      setError("Complete the location, membership, household head, and socio-economic fields.");
      return;
    }
    const household = addHousehold({
      barangayId,
      structureId,
      headResidentId: headId,
      members: selected.map((residentId) => ({
        residentId,
        relationshipToHead: residentId === headId ? "Head" : relationships[residentId] || "Other relative",
        joinedAt: "2026-09-23",
        leftAt: "",
        temporarilyAbsent: false,
        absenceReason: "",
      })),
      monthlyIncomeBracket: income,
      primaryLivelihood: livelihood,
      foodSecurity,
    });
    router.push(`/barangay-affairs/households/${household.id}?created=1`);
  };

  return (
    <div className={`${styles.page} ${styles.formShell}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Household Registry</p>
          <h1>Register household</h1>
          <p>Group existing A1 residents under one structure and household head.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/households/masterlist">
          <ArrowLeft size={15} /> Masterlist
        </Link>
      </header>
      {error ? <div className={`${styles.toast} ${styles.error}`}>{error}</div> : null}
      <form onSubmit={submit}>
        <section className={styles.card}>
          <div className={styles.formBody}>
            <h2 className={styles.sectionTitle}>1. Structure and normalized address</h2>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Barangay *</span>
                <select
                  value={barangayId}
                  onChange={(event) => {
                    setBarangayId(event.target.value);
                    setStructureId("");
                    setSelected([]);
                    setHeadId("");
                  }}
                >
                  <option value="">Select barangay</option>
                  {MATNOG_BARANGAYS.map((barangay) => (
                    <option key={barangay.code} value={barangay.code}>
                      {barangay.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${styles.field} ${styles.span3}`}>
                <span>Existing structure *</span>
                <select value={structureId} onChange={(event) => setStructureId(event.target.value)}>
                  <option value="">Select mapped structure</option>
                  {availableStructures.map((structure) => (
                    <option value={structure.id} key={structure.id}>
                      {structure.structureCode} · {formatStructureAddress(structure)}
                    </option>
                  ))}
                </select>
                <small>Multiple households can share one structure.</small>
              </label>
            </div>
            <h2 className={styles.sectionTitle}>2. Household members</h2>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search unassigned residents"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search unassigned active residents by name or LRN"
              />
            </label>
            <div className={styles.residentPicker}>
              {barangayId ? (
                results.map((resident) => (
                  <button
                    type="button"
                    key={resident.id}
                    className={`${styles.residentPick} ${selected.includes(resident.id) ? styles.residentPicked : ""}`}
                    onClick={() => toggle(resident.id)}
                  >
                    <span className={styles.pickCheck}>
                      {selected.includes(resident.id) ? <Check size={13} /> : null}
                    </span>
                    <span>
                      <strong>{formatResidentName(resident)}</strong>
                      <small>{resident.lrn}</small>
                    </span>
                  </button>
                ))
              ) : (
                <p className={styles.muted}>Select a barangay to see unassigned residents.</p>
              )}
            </div>
            {selectedResidents.length ? (
              <div className={styles.selectedMembers}>
                <h3>
                  <UsersRound size={16} /> Selected members
                </h3>
                {selectedResidents.map((resident) => (
                  <div key={resident.id}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="head"
                        checked={headId === resident.id}
                        onChange={() => setHeadId(resident.id)}
                      />
                      <span>
                        <strong>{formatResidentName(resident)}</strong>
                        <small>{resident.lrn}</small>
                      </span>
                    </label>
                    {headId !== resident.id ? (
                      <select
                        aria-label={`Relationship for ${formatResidentName(resident)}`}
                        value={relationships[resident.id] || "Other relative"}
                        onChange={(event) =>
                          setRelationships((current) => ({ ...current, [resident.id]: event.target.value }))
                        }
                      >
                        {relationshipOptions.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`${styles.badge} ${styles.active}`}>Household head</span>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <h2 className={styles.sectionTitle}>3. Socio-economic profile</h2>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Monthly income bracket *</span>
                <select value={income} onChange={(event) => setIncome(event.target.value)}>
                  <option value="">Select bracket</option>
                  {["Below ₱10,000", "₱10,000–₱19,999", "₱20,000–₱39,999", "₱40,000 and above"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Primary livelihood *</span>
                <select value={livelihood} onChange={(event) => setLivelihood(event.target.value)}>
                  <option value="">Select livelihood</option>
                  {[
                    "Farming",
                    "Fishing",
                    "Retail / sari-sari store",
                    "Construction",
                    "Transport",
                    "Government service",
                    "Tourism services",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Food security *</span>
                <select value={foodSecurity} onChange={(event) => setFoodSecurity(event.target.value)}>
                  <option value="">Select condition</option>
                  {["Food secure", "Mild concern", "Moderate concern", "Needs immediate assessment"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>
        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/barangay-affairs/households/masterlist">
            Cancel
          </Link>
          <button className={styles.primaryButton} type="submit">
            <Home size={15} /> Register household
          </button>
        </div>
      </form>
    </div>
  );
}
