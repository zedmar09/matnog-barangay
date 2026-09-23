"use client";

import { create } from "zustand";

import { createHouseholdDummyData } from "@/features/household-registry/data/household-dummy-data";
import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { deriveEvacuationEntries, deriveHazards } from "../data/disaster-derived-data";
import {
  createDamageAssessments,
  createEvacuationCentres,
  createFamilyAccessCards,
  createManifestRecords,
  createReliefDistributions,
} from "../data/disaster-operations-data";
import type {
  DamageAssessment,
  EvacuationCentre,
  EvacuationCentreStatus,
  EvacuationEntry,
  EvacuationManifestRecord,
  EvacuationStatus,
  FamilyAccessCard,
  ManifestStatus,
  ReliefDistribution,
  StructureHazard,
} from "../types/disaster";

type DisasterState = {
  hazards: StructureHazard[];
  evacuationEntries: EvacuationEntry[];
  centres: EvacuationCentre[];
  manifest: EvacuationManifestRecord[];
  familyCards: FamilyAccessCard[];
  reliefDistributions: ReliefDistribution[];
  damageAssessments: DamageAssessment[];
  updateEvacuationStatus: (id: string, status: EvacuationStatus) => void;
  updateCentreStatus: (id: string, status: EvacuationCentreStatus) => void;
  updateManifestStatus: (id: string, status: ManifestStatus) => void;
  markCardPrinted: (id: string) => void;
  releaseRelief: (id: string) => { success: boolean; message: string };
  validateDamageAssessment: (id: string) => void;
};

const residentData = createResidentDummyData(1200);
const householdData = createHouseholdDummyData(residentData);
const initialHazards = deriveHazards(householdData.structures);
const initialEntries = deriveEvacuationEntries(householdData.households, householdData.structures, initialHazards);
const initialCentres = createEvacuationCentres(householdData.structures);

export const useDisasterStore = create<DisasterState>((set, get) => ({
  hazards: initialHazards,
  evacuationEntries: initialEntries,
  centres: initialCentres,
  manifest: createManifestRecords(initialEntries, initialCentres),
  familyCards: createFamilyAccessCards(initialEntries, initialCentres, householdData.households, residentData),
  reliefDistributions: createReliefDistributions(initialEntries, initialCentres),
  damageAssessments: createDamageAssessments(initialEntries, initialHazards),
  updateEvacuationStatus: (id, status) =>
    set((state) => ({
      evacuationEntries: state.evacuationEntries.map((item) =>
        item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item,
      ),
    })),
  updateCentreStatus: (id, status) =>
    set((state) => ({
      centres: state.centres.map((item) =>
        item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item,
      ),
    })),
  updateManifestStatus: (id, status) =>
    set((state) => {
      const record = state.manifest.find((item) => item.id === id);
      if (!record) return state;
      const now = new Date().toISOString();
      return {
        manifest: state.manifest.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                checkedInAt: status === "Checked In" ? now : item.checkedInAt,
                checkedOutAt: status === "Checked Out" ? now : "",
                registeredBy: "Barangay DRRM Desk",
              }
            : item,
        ),
        evacuationEntries: state.evacuationEntries.map((item) =>
          item.id === record.evacuationEntryId
            ? { ...item, status: status === "Checked In" ? "Evacuated" : item.status, updatedAt: now }
            : item,
        ),
      };
    }),
  markCardPrinted: (id) =>
    set((state) => ({
      familyCards: state.familyCards.map((item) =>
        item.id === id ? { ...item, printedAt: new Date().toISOString() } : item,
      ),
    })),
  releaseRelief: (id) => {
    const target = get().reliefDistributions.find((item) => item.id === id);
    if (!target) return { success: false, message: "Relief record was not found." };
    const duplicate = get().reliefDistributions.find(
      (item) => item.id !== id && item.duplicateKey === target.duplicateKey && item.status === "Released",
    );
    if (duplicate) {
      const holdReason = `Blocked: already released under ${duplicate.referenceNumber}.`;
      set((state) => ({
        reliefDistributions: state.reliefDistributions.map((item) =>
          item.id === id ? { ...item, status: "Held", holdReason } : item,
        ),
      }));
      return { success: false, message: holdReason };
    }
    const now = new Date().toISOString();
    set((state) => ({
      reliefDistributions: state.reliefDistributions.map((item) =>
        item.id === id
          ? { ...item, status: "Released", releasedAt: now, releasedBy: "Barangay Relief Officer", holdReason: "" }
          : item,
      ),
    }));
    return { success: true, message: `${target.referenceNumber} released successfully.` };
  },
  validateDamageAssessment: (id) =>
    set((state) => ({
      damageAssessments: state.damageAssessments.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Validated",
              validatedAt: new Date().toISOString(),
              validatedBy: "Municipal DRRM Validator",
            }
          : item,
      ),
    })),
}));
