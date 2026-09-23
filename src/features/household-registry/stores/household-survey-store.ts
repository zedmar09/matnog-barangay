"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createHouseholdDummyData } from "../data/household-dummy-data";
import { createSurveyDummyData } from "../data/survey-dummy-data";
import type { Enumerator, HouseholdSurvey, SurveyStatus, SyncConflict } from "../types/survey";

type HouseholdSurveyState = {
  surveys: HouseholdSurvey[];
  enumerators: Enumerator[];
  conflicts: SyncConflict[];
  updateSurveyStatus: (id: string, status: SurveyStatus, note: string) => HouseholdSurvey | undefined;
  syncSurvey: (id: string) => HouseholdSurvey | undefined;
  resolveConflict: (id: string, resolution: "Keep Device" | "Keep Server") => SyncConflict | undefined;
};

const households = createHouseholdDummyData(createResidentDummyData(1200)).households;
const initialData = createSurveyDummyData(households);

export const useHouseholdSurveyStore = create<HouseholdSurveyState>((set, get) => ({
  ...initialData,
  updateSurveyStatus: (id, status, note) => {
    const survey = get().surveys.find((item) => item.id === id);
    if (!survey) return undefined;
    const now = new Date().toISOString();
    const updated: HouseholdSurvey = {
      ...survey,
      status,
      completionPercent:
        status === "Not Started" ? 0 : status === "In Progress" ? Math.max(25, survey.completionPercent) : 100,
      startedAt: status === "In Progress" && !survey.startedAt ? now : survey.startedAt,
      submittedAt: status === "Submitted" ? now : survey.submittedAt,
      verifiedAt: status === "Verified" ? now : survey.verifiedAt,
      verifiedBy: status === "Verified" ? "Barangay Verification Officer" : survey.verifiedBy,
      reviewNote: note.trim(),
      updatedAt: now,
    };
    set((state) => ({ surveys: state.surveys.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  syncSurvey: (id) => {
    const survey = get().surveys.find((item) => item.id === id);
    if (!survey || survey.syncStatus === "Conflict") return undefined;
    const updated = {
      ...survey,
      syncStatus: "Synced" as const,
      savedOfflineAt: "",
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ surveys: state.surveys.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  resolveConflict: (id, resolution) => {
    const conflict = get().conflicts.find((item) => item.id === id);
    if (!conflict || conflict.status === "Resolved") return undefined;
    const now = new Date().toISOString();
    const updated: SyncConflict = {
      ...conflict,
      status: "Resolved",
      resolution,
      resolvedBy: "Municipal Data Reviewer",
      resolvedAt: now,
    };
    set((state) => ({
      conflicts: state.conflicts.map((item) => (item.id === id ? updated : item)),
      surveys: state.surveys.map((survey) =>
        survey.id === conflict.surveyId ? { ...survey, syncStatus: "Synced", updatedAt: now } : survey,
      ),
    }));
    return updated;
  },
}));
