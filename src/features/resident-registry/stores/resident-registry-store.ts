"use client";

import { create } from "zustand";

import { MATNOG_BARANGAYS } from "@/data/barangays";

import { createDuplicateCandidates, createMergeLogs } from "../data/duplicate-dummy-data";
import { createIdentityMedia, createIdentityMediaReviews } from "../data/identity-media-dummy-data";
import { createLifeEventDummyData } from "../data/life-event-dummy-data";
import { createResidentDummyData } from "../data/resident-dummy-data";
import { createResidentIdDummyData } from "../data/resident-id-dummy-data";
import { createResidencyHistory, createTransferDummyData } from "../data/transfer-dummy-data";
import type {
  DuplicateCandidate,
  IdentityMediaInput,
  IdentityMediaReview,
  LifeEvent,
  LifeEventInput,
  LifeEventStatus,
  MediaReviewStatus,
  MergeFieldKey,
  MergeLog,
  ResidencyEntry,
  Resident,
  ResidentIdCard,
  ResidentIdentityMedia,
  ResidentIdInput,
  ResidentIdStatus,
  ResidentInput,
  TransferInput,
  TransferStatus,
  TransferTransaction,
} from "../types/resident";
import { normalizeName } from "../utils/resident-utils";

type ResidentRegistryState = {
  residents: Resident[];
  selectedBarangay: string;
  nextLrnSequence: number;
  duplicateCandidates: DuplicateCandidate[];
  mergeLogs: MergeLog[];
  transfers: TransferTransaction[];
  residencyHistory: ResidencyEntry[];
  lifeEvents: LifeEvent[];
  identityMedia: ResidentIdentityMedia[];
  mediaReviews: IdentityMediaReview[];
  residentIds: ResidentIdCard[];
  setBarangayScope: (barangayId: string) => void;
  addResident: (input: ResidentInput) => Resident;
  updateResident: (id: string, changes: Partial<ResidentInput> & { lrn?: string }) => Resident | undefined;
  getResidentById: (id: string) => Resident | undefined;
  updateDuplicateStatus: (id: string, status: DuplicateCandidate["status"], note: string) => void;
  mergeDuplicate: (
    candidateId: string,
    survivingResidentId: string,
    fieldSelections: Partial<Record<MergeFieldKey, "a" | "b">>,
    reason: string,
  ) => MergeLog | undefined;
  reverseMerge: (logId: string, reason: string) => boolean;
  initiateTransfer: (input: TransferInput) => TransferTransaction | undefined;
  updateTransferStatus: (id: string, status: TransferStatus, reason: string) => TransferTransaction | undefined;
  createLifeEvent: (input: LifeEventInput) => LifeEvent | undefined;
  reviewLifeEvent: (id: string, status: LifeEventStatus, reason: string) => LifeEvent | undefined;
  submitIdentityMedia: (input: IdentityMediaInput) => IdentityMediaReview | undefined;
  reviewIdentityMedia: (id: string, status: MediaReviewStatus, reason: string) => IdentityMediaReview | undefined;
  createResidentId: (input: ResidentIdInput) => ResidentIdCard | undefined;
  updateResidentIdStatus: (
    id: string,
    status: ResidentIdStatus,
    reason: string,
    releasedTo?: string,
  ) => ResidentIdCard | undefined;
  batchUpdateResidentIds: (ids: string[], status: "Printed" | "Released", reason: string) => number;
};

const initialResidents = createResidentDummyData(1200);
const initialIdentityMedia = createIdentityMedia(initialResidents);

/**
 * Temporary session-only LRN generator for the frontend dummy-data phase.
 * Backend integration must replace this with a concurrency-safe server/database sequence.
 */
function createLrn(sequence: number) {
  return `LRN-${String(sequence).padStart(12, "0")}`;
}

export const useResidentRegistryStore = create<ResidentRegistryState>((set, get) => ({
  residents: initialResidents,
  selectedBarangay: "all",
  nextLrnSequence: initialResidents.length + 1,
  duplicateCandidates: createDuplicateCandidates(initialResidents),
  mergeLogs: createMergeLogs(initialResidents),
  transfers: createTransferDummyData(initialResidents),
  residencyHistory: createResidencyHistory(initialResidents),
  lifeEvents: createLifeEventDummyData(initialResidents),
  identityMedia: initialIdentityMedia,
  mediaReviews: createIdentityMediaReviews(initialResidents, initialIdentityMedia),
  residentIds: createResidentIdDummyData(initialResidents, initialIdentityMedia),
  setBarangayScope: (selectedBarangay) => set({ selectedBarangay }),
  addResident: (input) => {
    const sequence = get().nextLrnSequence;
    const now = new Date().toISOString();
    const resident: Resident = {
      ...input,
      id: `resident-session-${sequence}`,
      lrn: createLrn(sequence),
      firstName: normalizeName(input.firstName),
      middleName: normalizeName(input.middleName),
      lastName: normalizeName(input.lastName),
      nickname: normalizeName(input.nickname),
      previousLastName: normalizeName(input.previousLastName),
      mothersMaidenName: normalizeName(input.mothersMaidenName),
      registrationDate: now.slice(0, 10),
      createdAt: now,
      updatedAt: now,
      philsysStatus: input.philsysReference ? "On File" : "Not Provided",
      philsysMockToken: input.philsysReference ? `mock-token-session-${sequence}` : "",
      philsysMockHash: input.philsysReference ? `mock-hash-session-${sequence}` : "",
    };
    set((state) => ({ residents: [resident, ...state.residents], nextLrnSequence: sequence + 1 }));
    return resident;
  },
  updateResident: (id, changes) => {
    const current = get().residents.find((resident) => resident.id === id);
    if (!current) return undefined;
    const { lrn: _ignoredLrn, philsysReference, ...safeChanges } = changes;
    const updated: Resident = {
      ...current,
      ...safeChanges,
      id: current.id,
      lrn: current.lrn,
      firstName: safeChanges.firstName ? normalizeName(safeChanges.firstName) : current.firstName,
      middleName: safeChanges.middleName !== undefined ? normalizeName(safeChanges.middleName) : current.middleName,
      lastName: safeChanges.lastName ? normalizeName(safeChanges.lastName) : current.lastName,
      nickname: safeChanges.nickname !== undefined ? normalizeName(safeChanges.nickname) : current.nickname,
      previousLastName:
        safeChanges.previousLastName !== undefined
          ? normalizeName(safeChanges.previousLastName)
          : current.previousLastName,
      mothersMaidenName:
        safeChanges.mothersMaidenName !== undefined
          ? normalizeName(safeChanges.mothersMaidenName)
          : current.mothersMaidenName,
      philsysStatus:
        philsysReference === undefined ? current.philsysStatus : philsysReference ? "On File" : "Not Provided",
      philsysMockToken:
        philsysReference === undefined ? current.philsysMockToken : philsysReference ? `mock-token-session-${id}` : "",
      philsysMockHash:
        philsysReference === undefined ? current.philsysMockHash : philsysReference ? `mock-hash-session-${id}` : "",
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ residents: state.residents.map((resident) => (resident.id === id ? updated : resident)) }));
    return updated;
  },
  getResidentById: (id) => get().residents.find((resident) => resident.id === id),
  updateDuplicateStatus: (id, status, note) => {
    const now = new Date().toISOString();
    set((state) => ({
      duplicateCandidates: state.duplicateCandidates.map((candidate) =>
        candidate.id === id ? { ...candidate, status, note, reviewer: "Barangay Admin", reviewedAt: now } : candidate,
      ),
    }));
  },
  mergeDuplicate: (candidateId, survivingResidentId, fieldSelections, reason) => {
    const state = get();
    const candidate = state.duplicateCandidates.find((item) => item.id === candidateId);
    if (!candidate || !reason.trim()) return undefined;
    const residentA = state.residents.find((item) => item.id === candidate.residentAId);
    const residentB = state.residents.find((item) => item.id === candidate.residentBId);
    if (!residentA || !residentB) return undefined;
    const survivor = survivingResidentId === residentA.id ? residentA : residentB;
    const retired = survivor.id === residentA.id ? residentB : residentA;
    const source = (field: MergeFieldKey) => (fieldSelections[field] === "b" ? residentB : residentA);
    const updatedSurvivor: Resident = {
      ...survivor,
      firstName: source("firstName").firstName,
      middleName: source("middleName").middleName,
      lastName: source("lastName").lastName,
      suffix: source("suffix").suffix,
      nickname: source("nickname").nickname,
      previousLastName: source("previousLastName").previousLastName,
      mothersMaidenName: source("mothersMaidenName").mothersMaidenName,
      birthDate: source("birthDate").birthDate,
      gender: source("gender").gender,
      civilStatus: source("civilStatus").civilStatus,
      primaryCitizenship: source("primaryCitizenship").primaryCitizenship,
      contact: {
        ...survivor.contact,
        primaryMobile: source("primaryMobile").contact.primaryMobile,
        email: source("email").contact.email,
      },
      address: {
        ...survivor.address,
        barangayId: source("barangayId").address.barangayId,
        purok: source("purok").address.purok,
        sitio: source("sitio").address.sitio,
        street: source("street").address.street,
        houseUnit: source("houseUnit").address.houseUnit,
      },
      updatedAt: new Date().toISOString(),
    };
    const retiredResident: Resident = { ...retired, residentStatus: "Merged", updatedAt: new Date().toISOString() };
    const log: MergeLog = {
      id: `merge-${Date.now()}`,
      candidateId,
      survivingResidentId: survivor.id,
      retiredResidentId: retired.id,
      survivingLrn: survivor.lrn,
      retiredLrn: retired.lrn,
      reviewer: "Barangay Admin",
      reason: reason.trim(),
      mergedAt: new Date().toISOString(),
      reversedAt: "",
      reversalReason: "",
      beforeSurvivor: { ...survivor, contact: { ...survivor.contact }, address: { ...survivor.address } },
      beforeRetired: { ...retired, contact: { ...retired.contact }, address: { ...retired.address } },
      fieldSelections,
    };
    set((current) => ({
      residents: current.residents.map((item) =>
        item.id === survivor.id ? updatedSurvivor : item.id === retired.id ? retiredResident : item,
      ),
      duplicateCandidates: current.duplicateCandidates.map((item) =>
        item.id === candidateId
          ? { ...item, status: "Merged", reviewer: "Barangay Admin", reviewedAt: log.mergedAt, note: reason.trim() }
          : item,
      ),
      mergeLogs: [log, ...current.mergeLogs],
    }));
    return log;
  },
  reverseMerge: (logId, reason) => {
    const log = get().mergeLogs.find((item) => item.id === logId);
    if (!log || log.reversedAt || !reason.trim()) return false;
    const reversedAt = new Date().toISOString();
    set((state) => ({
      residents: state.residents.map((item) =>
        item.id === log.beforeSurvivor.id
          ? log.beforeSurvivor
          : item.id === log.beforeRetired.id
            ? log.beforeRetired
            : item,
      ),
      duplicateCandidates: state.duplicateCandidates.map((item) =>
        item.id === log.candidateId
          ? { ...item, status: "Reversed", note: reason.trim(), reviewedAt: reversedAt }
          : item,
      ),
      mergeLogs: state.mergeLogs.map((item) =>
        item.id === logId ? { ...item, reversedAt, reversalReason: reason.trim() } : item,
      ),
    }));
    return true;
  },
  initiateTransfer: (input) => {
    const resident = get().residents.find((item) => item.id === input.residentId);
    if (
      !resident ||
      input.destinationBarangayId === "all" ||
      input.destinationBarangayId === resident.address.barangayId
    ) {
      return undefined;
    }
    const sequence = get().transfers.length + 1;
    const now = new Date().toISOString();
    const transfer: TransferTransaction = {
      id: `transfer-session-${sequence}`,
      referenceNumber: `TRF-2026-${String(sequence).padStart(5, "0")}`,
      residentId: resident.id,
      originBarangayId: resident.address.barangayId,
      destinationBarangayId: input.destinationBarangayId,
      requestedEffectiveDate: input.requestedEffectiveDate,
      reason: input.reason.trim(),
      supportingDocumentCount: input.supportingDocumentCount,
      status: "Requested",
      requestedBy: "Barangay Admin",
      requestedAt: now,
      releasedBy: "",
      releasedAt: "",
      reviewedBy: "",
      reviewedAt: "",
      completedAt: "",
      decisionReason: "",
      updatedAt: now,
    };
    set((state) => ({ transfers: [transfer, ...state.transfers] }));
    return transfer;
  },
  updateTransferStatus: (id, status, reason) => {
    const state = get();
    const transfer = state.transfers.find((item) => item.id === id);
    if (!transfer || !reason.trim()) return undefined;
    const now = new Date().toISOString();
    const reviewed = ["Accepted", "Rejected", "Clarification Requested"].includes(status);
    const next: TransferTransaction = {
      ...transfer,
      status,
      updatedAt: now,
      decisionReason: reason.trim(),
      releasedBy: status === "Awaiting Acceptance" ? "Origin Barangay Admin" : transfer.releasedBy,
      releasedAt: status === "Awaiting Acceptance" ? now : transfer.releasedAt,
      reviewedBy: reviewed ? "Destination Barangay Admin" : transfer.reviewedBy,
      reviewedAt: reviewed ? now : transfer.reviewedAt,
      completedAt: status === "Accepted" ? now : transfer.completedAt,
    };
    if (status !== "Accepted") {
      set((current) => ({ transfers: current.transfers.map((item) => (item.id === id ? next : item)) }));
      return next;
    }
    const resident = state.residents.find((item) => item.id === transfer.residentId);
    if (!resident) return undefined;
    const currentHistory = state.residencyHistory.find(
      (entry) => entry.residentId === resident.id && entry.status === "Current",
    );
    const startDate = transfer.requestedEffectiveDate || now.slice(0, 10);
    const closedHistory: ResidencyEntry | undefined = currentHistory
      ? { ...currentHistory, status: "Historical", endDate: startDate, transferId: transfer.referenceNumber }
      : undefined;
    const newHistory: ResidencyEntry = {
      id: `residency-${transfer.id}-${Date.now()}`,
      residentId: resident.id,
      barangayId: transfer.destinationBarangayId,
      startDate,
      endDate: "",
      transferId: transfer.referenceNumber,
      status: "Current",
      processedBy: "Destination Barangay Admin",
      remarks: reason.trim(),
    };
    set((current) => ({
      transfers: current.transfers.map((item) => (item.id === id ? next : item)),
      residents: current.residents.map((item) =>
        item.id === resident.id
          ? { ...item, address: { ...item.address, barangayId: transfer.destinationBarangayId }, updatedAt: now }
          : item,
      ),
      residencyHistory: [
        newHistory,
        ...current.residencyHistory
          .filter((entry) => entry.id !== currentHistory?.id)
          .concat(closedHistory ? [closedHistory] : []),
      ],
    }));
    return next;
  },
  createLifeEvent: (input) => {
    if (input.eventType !== "Birth" && !get().residents.some((resident) => resident.id === input.residentId))
      return undefined;
    if (!input.eventType || !input.effectiveDate || !input.barangayId) return undefined;
    const sequence = get().lifeEvents.length + 1;
    const now = new Date().toISOString();
    const event: LifeEvent = {
      ...input,
      id: `life-event-session-${sequence}`,
      referenceNumber: `LEV-2026-${String(sequence).padStart(5, "0")}`,
      generatedResidentId: "",
      status: "Pending Review",
      requestedBy: "Barangay Admin",
      requestedAt: now,
      reviewedBy: "",
      reviewedAt: "",
      decisionReason: "",
      updatedAt: now,
    };
    set((state) => ({ lifeEvents: [event, ...state.lifeEvents] }));
    return event;
  },
  reviewLifeEvent: (id, status, reason) => {
    const event = get().lifeEvents.find((item) => item.id === id);
    if (!event || !reason.trim()) return undefined;
    const now = new Date().toISOString();
    let generatedResidentId = event.generatedResidentId;
    if (status === "Approved" && event.eventType === "Birth" && !generatedResidentId) {
      const created = get().addResident({
        firstName: event.details.proposedFirstName,
        middleName: event.details.proposedMiddleName,
        lastName: event.details.proposedLastName,
        suffix: "",
        nickname: "",
        previousLastName: "",
        mothersMaidenName: event.details.motherName,
        birthDate: event.effectiveDate,
        birthLocality: "Matnog",
        birthBarangay: MATNOG_BARANGAYS.find((item) => item.code === event.barangayId)?.name ?? "",
        birthMunicipality: "Matnog",
        birthProvince: "Sorsogon",
        birthRegion: "Bicol Region",
        birthCountry: "Philippines",
        gender: event.details.proposedGender,
        civilStatus: "Single",
        primaryCitizenship: "Filipino",
        secondaryCitizenship: "",
        employmentStatus: "Not Applicable",
        occupation: "",
        employerName: "",
        workplaceAddress: "",
        address: {
          region: "Bicol Region",
          province: "Sorsogon",
          municipality: "Matnog",
          barangayId: event.barangayId,
          district: "",
          purok: "",
          sitio: "",
          zone: "",
          subdivision: "",
          street: "",
          buildingName: "",
          houseUnit: "",
          lotNumber: "",
          blockNumber: "",
          phase: "",
          postalCode: "4708",
          landmark: "",
        },
        contact: { primaryMobile: "", secondaryMobile: "", landline: "", email: "" },
        isPwd: false,
        residentStatus: "Active",
        photoUrl: "",
        philsysReference: "",
      });
      generatedResidentId = created.id;
      set((state) => ({
        residencyHistory: [
          {
            id: `residency-birth-${created.id}`,
            residentId: created.id,
            barangayId: event.barangayId,
            startDate: event.effectiveDate,
            endDate: "",
            transferId: event.referenceNumber,
            status: "Current",
            processedBy: "Municipal Registry Officer",
            remarks: "Residency created from approved birth registration",
          },
          ...state.residencyHistory,
        ],
      }));
    }
    if (status === "Approved" && event.eventType !== "Birth") {
      const resident = get().residents.find((item) => item.id === event.residentId);
      if (resident) {
        const changes: Partial<Resident> = { updatedAt: now };
        if (event.eventType === "Marriage") {
          changes.civilStatus = "Married";
          if (event.details.proposedMarriedName) {
            changes.previousLastName = resident.previousLastName || resident.lastName;
            changes.lastName = event.details.proposedMarriedName;
          }
        }
        if (event.eventType === "Civil Status Change") changes.civilStatus = event.details.proposedCivilStatus;
        if (event.eventType === "Death") changes.residentStatus = "Deceased";
        if (event.eventType === "Migration Out") changes.residentStatus = "Transferred Out";
        if (event.eventType === "Migration In") {
          changes.residentStatus = "Active";
          changes.address = { ...resident.address, barangayId: event.barangayId };
        }
        set((state) => ({
          residents: state.residents.map((item) => (item.id === resident.id ? { ...item, ...changes } : item)),
          residencyHistory:
            event.eventType === "Migration In"
              ? [
                  {
                    id: `residency-life-event-${event.id}`,
                    residentId: resident.id,
                    barangayId: event.barangayId,
                    startDate: event.effectiveDate,
                    endDate: "",
                    transferId: event.referenceNumber,
                    status: "Current",
                    processedBy: "Municipal Registry Officer",
                    remarks: "Residency activated through migration-in event",
                  },
                  ...state.residencyHistory.map((entry) =>
                    entry.residentId === resident.id && entry.status === "Current"
                      ? { ...entry, status: "Historical" as const, endDate: event.effectiveDate }
                      : entry,
                  ),
                ]
              : state.residencyHistory.map((entry) =>
                  event.eventType === "Migration Out" && entry.residentId === resident.id && entry.status === "Current"
                    ? {
                        ...entry,
                        status: "Historical" as const,
                        endDate: event.effectiveDate,
                        transferId: event.referenceNumber,
                      }
                    : entry,
                ),
        }));
      }
    }
    const reviewed: LifeEvent = {
      ...event,
      status,
      generatedResidentId,
      reviewedBy: "Municipal Registry Officer",
      reviewedAt: now,
      decisionReason: reason.trim(),
      updatedAt: now,
    };
    set((state) => ({ lifeEvents: state.lifeEvents.map((item) => (item.id === id ? reviewed : item)) }));
    return reviewed;
  },
  submitIdentityMedia: (input) => {
    if (!get().residents.some((resident) => resident.id === input.residentId)) return undefined;
    if (!input.proposedPhotoUrl && !input.proposedSignatureUrl) return undefined;
    const sequence = get().mediaReviews.length + 1;
    const now = new Date().toISOString();
    const review: IdentityMediaReview = {
      ...input,
      id: `media-review-session-${sequence}`,
      referenceNumber: `MED-2026-${String(sequence).padStart(5, "0")}`,
      status: "Pending Review",
      requestedBy: "Barangay Admin",
      requestedAt: now,
      reviewedBy: "",
      reviewedAt: "",
      decisionReason: "",
    };
    set((state) => ({ mediaReviews: [review, ...state.mediaReviews] }));
    return review;
  },
  reviewIdentityMedia: (id, status, reason) => {
    const review = get().mediaReviews.find((item) => item.id === id);
    if (!review || !reason.trim()) return undefined;
    const now = new Date().toISOString();
    const updated: IdentityMediaReview = {
      ...review,
      status,
      reviewedBy: "Municipal Registry Officer",
      reviewedAt: now,
      decisionReason: reason.trim(),
    };
    set((state) => ({
      mediaReviews: state.mediaReviews.map((item) => (item.id === id ? updated : item)),
      identityMedia:
        status === "Approved"
          ? state.identityMedia.map((item) =>
              item.residentId === review.residentId
                ? {
                    ...item,
                    photoUrl: review.proposedPhotoUrl || item.photoUrl,
                    signatureUrl: review.proposedSignatureUrl || item.signatureUrl,
                    photoCapturedAt: review.proposedPhotoUrl ? review.requestedAt : item.photoCapturedAt,
                    signatureCapturedAt: review.proposedSignatureUrl ? review.requestedAt : item.signatureCapturedAt,
                    capturedBy: review.requestedBy,
                    status: "Verified",
                    verifiedBy: "Municipal Registry Officer",
                    verifiedAt: now,
                  }
                : item,
            )
          : status === "Recapture Required"
            ? state.identityMedia.map((item) =>
                item.residentId === review.residentId ? { ...item, status: "Recapture Required" } : item,
              )
            : state.identityMedia,
      residents:
        status === "Approved" && review.proposedPhotoUrl
          ? state.residents.map((resident) =>
              resident.id === review.residentId
                ? { ...resident, photoUrl: review.proposedPhotoUrl, updatedAt: now }
                : resident,
            )
          : state.residents,
    }));
    return updated;
  },
  createResidentId: (input) => {
    const resident = get().residents.find((item) => item.id === input.residentId);
    const media = get().identityMedia.find((item) => item.residentId === input.residentId);
    if (resident?.residentStatus !== "Active" || media?.status !== "Verified" || !media.photoUrl) return undefined;
    const sequence = get().residentIds.length + 1;
    const now = new Date().toISOString();
    const card: ResidentIdCard = {
      id: `resident-id-session-${sequence}`,
      cardNumber: `MID-2026-${String(sequence).padStart(7, "0")}`,
      residentId: resident.id,
      barangayId: resident.address.barangayId,
      verificationToken: `matnog-rid-session-${sequence}-${Date.now().toString(36)}`,
      status: "Generated",
      issueDate: input.issueDate,
      expirationDate: input.expirationDate,
      emergencyContactName: input.emergencyContactName.trim(),
      emergencyContactNumber: input.emergencyContactNumber.trim(),
      issuingAuthority: "Municipality of Matnog",
      generatedBy: "Municipal ID Officer",
      generatedAt: now,
      printedBy: "",
      printedAt: "",
      releasedTo: "",
      releasedBy: "",
      releasedAt: "",
      replacementForId: input.replacementForId,
      actionReason: input.actionReason.trim(),
      updatedAt: now,
    };
    set((state) => ({
      residentIds: [
        card,
        ...state.residentIds.map((item) =>
          input.replacementForId && item.id === input.replacementForId
            ? { ...item, status: "Replaced" as const, updatedAt: now, actionReason: input.actionReason.trim() }
            : item,
        ),
      ],
    }));
    return card;
  },
  updateResidentIdStatus: (id, status, reason, releasedTo = "") => {
    const card = get().residentIds.find((item) => item.id === id);
    if (!card || !reason.trim()) return undefined;
    const now = new Date().toISOString();
    const updated: ResidentIdCard = {
      ...card,
      status,
      actionReason: reason.trim(),
      generatedBy: status === "Generated" ? "Municipal ID Officer" : card.generatedBy,
      generatedAt: status === "Generated" ? now : card.generatedAt,
      printedBy: status === "Printed" ? "Municipal ID Officer" : card.printedBy,
      printedAt: status === "Printed" ? now : card.printedAt,
      releasedTo: status === "Released" ? releasedTo || "Resident / authorized recipient" : card.releasedTo,
      releasedBy: status === "Released" ? "Barangay Releasing Staff" : card.releasedBy,
      releasedAt: status === "Released" ? now : card.releasedAt,
      updatedAt: now,
    };
    set((state) => ({ residentIds: state.residentIds.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  batchUpdateResidentIds: (ids, status, reason) => {
    if (!ids.length || !reason.trim()) return 0;
    const now = new Date().toISOString();
    const idSet = new Set(ids);
    set((state) => ({
      residentIds: state.residentIds.map((item) =>
        idSet.has(item.id)
          ? {
              ...item,
              status,
              actionReason: reason.trim(),
              printedBy: status === "Printed" ? "Municipal ID Officer" : item.printedBy,
              printedAt: status === "Printed" ? now : item.printedAt,
              releasedTo: status === "Released" ? "Resident / authorized recipient" : item.releasedTo,
              releasedBy: status === "Released" ? "Barangay Releasing Staff" : item.releasedBy,
              releasedAt: status === "Released" ? now : item.releasedAt,
              updatedAt: now,
            }
          : item,
      ),
    }));
    return ids.length;
  },
}));
