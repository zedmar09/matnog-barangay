"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createSectorMembershipDummyData, SECTOR_DEFINITIONS } from "../data/sector-dummy-data";
import { createSectorWorkflowDummyData } from "../data/sector-workflow-dummy-data";
import type {
  BenefitAvailment,
  CertificationStatus,
  CredentialStatus,
  CredentialType,
  EligibilityAlert,
  SectorCertificationRequest,
  SectorCredential,
  SectorDefinition,
  SectorMembership,
  SectorMembershipInput,
  SectorMembershipStatus,
} from "../types/sector";

type SectorRegistryState = {
  definitions: SectorDefinition[];
  memberships: SectorMembership[];
  certificationRequests: SectorCertificationRequest[];
  credentials: SectorCredential[];
  alerts: EligibilityAlert[];
  benefits: BenefitAvailment[];
  addMembership: (input: SectorMembershipInput) => SectorMembership | undefined;
  updateMembershipStatus: (id: string, status: SectorMembershipStatus, remarks: string) => SectorMembership | undefined;
  updateCertificationStatus: (
    id: string,
    status: CertificationStatus,
    note: string,
    reviewedBy?: string,
  ) => SectorCertificationRequest | undefined;
  createCredential: (
    membershipId: string,
    type: CredentialType,
    replacementForId?: string,
  ) => SectorCredential | undefined;
  updateCredentialStatus: (id: string, status: CredentialStatus, reason?: string) => SectorCredential | undefined;
  updateAlertStatus: (id: string, status: "Resolved" | "Dismissed") => EligibilityAlert | undefined;
};

const initialResidents = createResidentDummyData(1200);
const initialMemberships = createSectorMembershipDummyData(initialResidents);
const workflow = createSectorWorkflowDummyData(initialResidents, initialMemberships);

export const useSectorRegistryStore = create<SectorRegistryState>((set, get) => ({
  definitions: SECTOR_DEFINITIONS,
  memberships: initialMemberships,
  certificationRequests: workflow.certificationRequests,
  credentials: workflow.credentials,
  alerts: workflow.alerts,
  benefits: workflow.benefits,
  addMembership: (input) => {
    if (
      get().memberships.some(
        (item) =>
          item.residentId === input.residentId && item.sectorCode === input.sectorCode && item.status !== "Inactive",
      )
    )
      return undefined;
    const definition = get().definitions.find((item) => item.code === input.sectorCode);
    if (!definition) return undefined;
    const sequence = get().memberships.length + 1;
    const now = new Date().toISOString();
    const membership: SectorMembership = {
      id: `sector-membership-session-${sequence}`,
      ...input,
      status: "Pending Review",
      certifiedByBarangay: false,
      certifiedAt: "",
      issuingOffice: definition.issuingOffice,
      referenceNumber: `SEC-${input.sectorCode.toUpperCase()}-${String(sequence).padStart(7, "0")}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ memberships: [membership, ...state.memberships] }));
    return membership;
  },
  updateMembershipStatus: (id, status, remarks) => {
    const membership = get().memberships.find((item) => item.id === id);
    if (!membership) return undefined;
    const now = new Date().toISOString();
    const updated: SectorMembership = {
      ...membership,
      status,
      remarks: remarks.trim() || membership.remarks,
      certifiedByBarangay: status === "Active" ? true : membership.certifiedByBarangay,
      certifiedAt: status === "Active" ? now : membership.certifiedAt,
      updatedAt: now,
    };
    set((state) => ({ memberships: state.memberships.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  updateCertificationStatus: (id, status, note, reviewedBy = "") => {
    const request = get().certificationRequests.find((item) => item.id === id);
    if (!request) return undefined;
    const now = new Date().toISOString();
    const actor =
      reviewedBy.trim() || (status === "Barangay Certified" ? "Barangay Registry Officer" : "Municipal Sector Desk");
    const updated: SectorCertificationRequest = {
      ...request,
      status,
      decisionNote: note.trim() || request.decisionNote,
      barangayCertifiedBy: status === "Barangay Certified" ? actor : request.barangayCertifiedBy,
      barangayCertifiedAt: status !== "Submitted" ? request.barangayCertifiedAt || now : request.barangayCertifiedAt,
      municipalReviewedBy:
        status === "Municipal Review" || status === "Approved" || status === "Rejected"
          ? actor
          : request.municipalReviewedBy,
      municipalReviewedAt:
        status === "Municipal Review" || status === "Approved" || status === "Rejected"
          ? now
          : request.municipalReviewedAt,
      lastActionBy: actor,
      lastActionAt: now,
      updatedAt: now,
    };
    set((state) => ({
      certificationRequests: state.certificationRequests.map((item) => (item.id === id ? updated : item)),
    }));
    return updated;
  },
  createCredential: (membershipId, type, replacementForId = "") => {
    const membership = get().memberships.find((item) => item.id === membershipId);
    if (!membership) return undefined;
    const sequence = get().credentials.length + 1;
    const now = new Date();
    const credential: SectorCredential = {
      id: `sector-credential-session-${sequence}`,
      credentialNumber: `${type === "Booklet" ? "BKT" : "SID"}-${membership.sectorCode.toUpperCase()}-${String(sequence).padStart(6, "0")}`,
      membershipId,
      residentId: membership.residentId,
      sectorCode: membership.sectorCode,
      credentialType: type,
      status: "Pending Production",
      issuedAt: now.toISOString().slice(0, 10),
      expiresAt: new Date(now.getFullYear() + 3, now.getMonth(), now.getDate()).toISOString().slice(0, 10),
      releasedAt: "",
      releasedBy: "",
      replacementForId,
      reason: replacementForId ? "Replacement requested" : "Initial issuance",
      updatedAt: now.toISOString(),
    };
    set((state) => ({
      credentials: [credential, ...state.credentials].map((item) =>
        replacementForId && item.id === replacementForId
          ? { ...item, status: "Replaced" as const, updatedAt: now.toISOString() }
          : item,
      ),
    }));
    return credential;
  },
  updateCredentialStatus: (id, status, reason = "") => {
    const credential = get().credentials.find((item) => item.id === id);
    if (!credential) return undefined;
    const now = new Date().toISOString();
    const updated: SectorCredential = {
      ...credential,
      status,
      reason: reason.trim() || credential.reason,
      releasedAt: status === "Released" ? now.slice(0, 10) : credential.releasedAt,
      releasedBy: status === "Released" ? "Municipal Releasing Officer" : credential.releasedBy,
      updatedAt: now,
    };
    set((state) => ({ credentials: state.credentials.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  updateAlertStatus: (id, status) => {
    const alert = get().alerts.find((item) => item.id === id);
    if (!alert) return undefined;
    const updated: EligibilityAlert = { ...alert, status, resolvedAt: new Date().toISOString() };
    set((state) => ({ alerts: state.alerts.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
}));
