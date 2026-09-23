"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createIssuedDocumentDummyData } from "../data/document-dummy-data";
import { DOCUMENT_TEMPLATES } from "../data/document-templates";
import type {
  DocumentTemplate,
  IssuedDocument,
  IssuedDocumentStatus,
  ReprintRequest,
  RevocationRecord,
} from "../types/document";

type NewDocumentInput = Omit<
  IssuedDocument,
  | "id"
  | "controlNumber"
  | "requestedAt"
  | "updatedAt"
  | "releasedAt"
  | "releasedTo"
  | "paymentVerified"
  | "reviewNote"
  | "reprintCount"
  | "auditTrail"
  | "verificationToken"
>;

type DocumentState = {
  templates: DocumentTemplate[];
  documents: IssuedDocument[];
  reprintRequests: ReprintRequest[];
  revocations: RevocationRecord[];
  createDocument: (input: NewDocumentInput) => IssuedDocument;
  updateDocumentStatus: (
    id: string,
    status: IssuedDocumentStatus,
    note: string,
    actor?: string,
  ) => IssuedDocument | undefined;
  verifyPayment: (id: string, receipt: string, amount: number) => IssuedDocument | undefined;
  releaseDocument: (id: string, releasedTo: string, note: string) => IssuedDocument | undefined;
  requestReprint: (documentId: string, reason: string, requestedBy: string) => ReprintRequest | undefined;
  updateReprintStatus: (
    id: string,
    status: "Approved" | "Printed" | "Rejected",
    reviewer: string,
  ) => ReprintRequest | undefined;
  revokeDocument: (documentId: string, reason: string) => RevocationRecord | undefined;
};

const rawDocuments = createIssuedDocumentDummyData(createResidentDummyData(1200));
const initialDocuments = rawDocuments.map((document, index) =>
  index > 0 && index % 31 === 0
    ? {
        ...document,
        status: "Revoked" as const,
        reviewNote: "Original copy invalidated after reported loss or data correction.",
      }
    : document,
);
const initialReprints: ReprintRequest[] = initialDocuments
  .filter((document) => document.status === "Released")
  .slice(0, 18)
  .map((document, index) => ({
    id: `reprint-${String(index + 1).padStart(5, "0")}`,
    documentId: document.id,
    reason: index % 2 ? "Original copy was damaged." : "Additional certified copy requested.",
    requestedBy: document.releasedTo,
    status: index % 3 === 0 ? "Pending" : index % 3 === 1 ? "Approved" : "Printed",
    requestedAt: `2026-09-${String((index % 20) + 1).padStart(2, "0")}T08:00:00.000Z`,
    reviewedAt: index % 3 === 0 ? "" : `2026-09-${String((index % 20) + 1).padStart(2, "0")}T10:00:00.000Z`,
    reviewedBy: index % 3 === 0 ? "" : "Barangay Secretary",
  }));
const initialRevocations: RevocationRecord[] = initialDocuments
  .filter((document) => document.status === "Revoked")
  .map((document, index) => ({
    id: `revocation-${String(index + 1).padStart(5, "0")}`,
    documentId: document.id,
    reason: document.reviewNote,
    revokedAt: "2026-09-15T10:00:00.000Z",
    revokedBy: "Punong Barangay",
  }));

export const useDocumentStore = create<DocumentState>((set, get) => ({
  templates: DOCUMENT_TEMPLATES,
  documents: initialDocuments,
  reprintRequests: initialReprints,
  revocations: initialRevocations,
  createDocument: (input) => {
    const template = get().templates.find((item) => item.code === input.templateCode);
    const sequence = get().documents.length + 1;
    const now = new Date().toISOString();
    const document: IssuedDocument = {
      ...input,
      id: `document-session-${sequence}`,
      controlNumber: `${template?.shortCode ?? "DOC"}-${new Date().getFullYear()}-${String(sequence).padStart(6, "0")}`,
      requestedAt: now,
      updatedAt: now,
      releasedAt: "",
      releasedTo: "",
      paymentVerified: !template?.requiresOr,
      reviewNote: "",
      reprintCount: 0,
      verificationToken: `matnog-document-session-${sequence}`,
      auditTrail: [
        {
          id: `document-audit-session-${sequence}-1`,
          action: "Request created",
          actor: "Barangay Front Desk",
          note: "Document request encoded from the selected resident record.",
          occurredAt: now,
        },
      ],
    };
    set((state) => ({ documents: [document, ...state.documents] }));
    return document;
  },
  updateDocumentStatus: (id, status, note, actor = "Barangay Document Officer") => {
    const current = get().documents.find((item) => item.id === id);
    if (!current || !note.trim()) return undefined;
    const now = new Date().toISOString();
    const updated: IssuedDocument = {
      ...current,
      status,
      reviewNote: note.trim(),
      updatedAt: now,
      auditTrail: [
        ...current.auditTrail,
        { id: `document-audit-${Date.now()}`, action: status, actor, note: note.trim(), occurredAt: now },
      ],
    };
    set((state) => ({ documents: state.documents.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  verifyPayment: (id, receipt, amount) => {
    const current = get().documents.find((item) => item.id === id);
    if (!current || !receipt.trim()) return undefined;
    const now = new Date().toISOString();
    const updated: IssuedDocument = {
      ...current,
      officialReceipt: receipt.trim(),
      amountPaid: amount,
      paymentVerified: true,
      updatedAt: now,
      auditTrail: [
        ...current.auditTrail,
        {
          id: `document-audit-${Date.now()}`,
          action: "Payment verified",
          actor: "Barangay Treasurer",
          note: `Official receipt ${receipt.trim()} verified for ₱${amount.toFixed(2)}.`,
          occurredAt: now,
        },
      ],
    };
    set((state) => ({ documents: state.documents.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  releaseDocument: (id, releasedTo, note) => {
    const current = get().documents.find((item) => item.id === id);
    const template = current ? get().templates.find((item) => item.code === current.templateCode) : undefined;
    if (!current || !releasedTo.trim() || !note.trim() || (template?.requiresOr && !current.paymentVerified))
      return undefined;
    const now = new Date().toISOString();
    const updated: IssuedDocument = {
      ...current,
      status: "Released",
      releasedAt: now,
      releasedTo: releasedTo.trim(),
      reviewNote: note.trim(),
      updatedAt: now,
      auditTrail: [
        ...current.auditTrail,
        {
          id: `document-audit-${Date.now()}`,
          action: "Released",
          actor: "Barangay Releasing Officer",
          note: `${note.trim()} Released to ${releasedTo.trim()}.`,
          occurredAt: now,
        },
      ],
    };
    set((state) => ({ documents: state.documents.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  requestReprint: (documentId, reason, requestedBy) => {
    const document = get().documents.find((item) => item.id === documentId);
    if (document?.status !== "Released" || !reason.trim() || !requestedBy.trim()) return undefined;
    const now = new Date().toISOString();
    const request: ReprintRequest = {
      id: `reprint-session-${get().reprintRequests.length + 1}`,
      documentId,
      reason: reason.trim(),
      requestedBy: requestedBy.trim(),
      status: "Pending",
      requestedAt: now,
      reviewedAt: "",
      reviewedBy: "",
    };
    set((state) => ({ reprintRequests: [request, ...state.reprintRequests] }));
    return request;
  },
  updateReprintStatus: (id, status, reviewer) => {
    const request = get().reprintRequests.find((item) => item.id === id);
    if (!request || !reviewer.trim()) return undefined;
    const updated = { ...request, status, reviewedAt: new Date().toISOString(), reviewedBy: reviewer.trim() };
    set((state) => ({
      reprintRequests: state.reprintRequests.map((item) => (item.id === id ? updated : item)),
      documents:
        status === "Printed"
          ? state.documents.map((item) =>
              item.id === request.documentId
                ? {
                    ...item,
                    reprintCount: item.reprintCount + 1,
                    updatedAt: new Date().toISOString(),
                    auditTrail: [
                      ...item.auditTrail,
                      {
                        id: `document-audit-${Date.now()}`,
                        action: "Reprint produced",
                        actor: reviewer.trim(),
                        note: request.reason,
                        occurredAt: new Date().toISOString(),
                      },
                    ],
                  }
                : item,
            )
          : state.documents,
    }));
    return updated;
  },
  revokeDocument: (documentId, reason) => {
    const document = get().documents.find((item) => item.id === documentId);
    if (document?.status !== "Released" || !reason.trim()) return undefined;
    const now = new Date().toISOString();
    const record: RevocationRecord = {
      id: `revocation-session-${get().revocations.length + 1}`,
      documentId,
      reason: reason.trim(),
      revokedAt: now,
      revokedBy: "Punong Barangay",
    };
    set((state) => ({
      revocations: [record, ...state.revocations],
      documents: state.documents.map((item) =>
        item.id === documentId
          ? {
              ...item,
              status: "Revoked",
              reviewNote: reason.trim(),
              updatedAt: now,
              auditTrail: [
                ...item.auditTrail,
                {
                  id: `document-audit-${Date.now()}`,
                  action: "Revoked",
                  actor: "Punong Barangay",
                  note: reason.trim(),
                  occurredAt: now,
                },
              ],
            }
          : item,
      ),
    }));
    return record;
  },
}));
