import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { AuditAction, AuditEvent, AuditResult } from "../types/access";
import { ACCESS_ACCOUNTS } from "./access-data";

const MODULE_EVENTS = [
  {
    module: "Resident Registry",
    type: "Resident",
    prefix: "LRN",
    action: "Updated" as AuditAction,
    sensitivity: "Confidential" as const,
    reason: "Verified resident profile during registry updating.",
  },
  {
    module: "Households & Structures",
    type: "Household",
    prefix: "HH",
    action: "Viewed" as AuditAction,
    sensitivity: "Confidential" as const,
    reason: "Reviewed household composition for service validation.",
  },
  {
    module: "Certifications & Clearances",
    type: "Document",
    prefix: "DOC",
    action: "Approved" as AuditAction,
    sensitivity: "Standard" as const,
    reason: "Approved document after checking registry information.",
  },
  {
    module: "Assistance & Benefits",
    type: "Assistance request",
    prefix: "AST",
    action: "Created" as AuditAction,
    sensitivity: "Confidential" as const,
    reason: "Encoded assistance request with supporting records.",
  },
  {
    module: "Peace & Order",
    type: "Blotter record",
    prefix: "BLT",
    action: "Viewed" as AuditAction,
    sensitivity: "Restricted" as const,
    reason: "Case follow-up authorized by the Barangay Chairperson.",
  },
  {
    module: "Planning & Development",
    type: "Project proposal",
    prefix: "BDP",
    action: "Updated" as AuditAction,
    sensitivity: "Standard" as const,
    reason: "Updated indicative cost and implementation schedule.",
  },
  {
    module: "Administration",
    type: "Staff account",
    prefix: "USR",
    action: "Access changed" as AuditAction,
    sensitivity: "Restricted" as const,
    reason: "Reviewed role and permission assignment.",
  },
  {
    module: "Reports & Analytics",
    type: "RBI extract",
    prefix: "RBI",
    action: "Exported" as AuditAction,
    sensitivity: "Confidential" as const,
    reason: "Generated authorized operational report.",
  },
];

const hashFor = (sequence: number, barangayCode: string, module: string) =>
  `${(sequence * 2654435761).toString(16).padStart(8, "0")}${barangayCode.slice(-6)}${module.length.toString(16).padStart(2, "0")}a9f3c7e2`;

const barangayEvents: AuditEvent[] = MATNOG_BARANGAYS.flatMap((barangay, barangayIndex) => {
  const accounts = ACCESS_ACCOUNTS.filter((account) => account.barangayId === barangay.code);
  return MODULE_EVENTS.map((template, eventIndex) => {
    const sequence = barangayIndex * MODULE_EVENTS.length + eventIndex + 1;
    const actor = accounts[eventIndex % accounts.length];
    const denied = eventIndex === 4 && barangayIndex % 9 === 0;
    const result: AuditResult = denied ? "Denied" : "Success";
    const day = String(23 - ((barangayIndex + eventIndex) % 12)).padStart(2, "0");
    const hour = String(7 + ((barangayIndex * 2 + eventIndex) % 11)).padStart(2, "0");
    const recordId = `${template.prefix}-${barangay.code}-${String((barangayIndex + 1) * 10 + eventIndex).padStart(4, "0")}`;
    return {
      id: `AUD-2026-${String(sequence).padStart(6, "0")}`,
      sequence,
      occurredAt: `2026-09-${day}T${hour}:${String((eventIndex * 7) % 60).padStart(2, "0")}:00+08:00`,
      actorId: actor.id,
      action: template.action,
      module: template.module,
      recordType: template.type,
      recordId,
      barangayId: barangay.code,
      ipAddress: `10.62.${barangayIndex + 1}.${21 + (eventIndex % 2)}`,
      device: eventIndex % 3 === 0 ? "Chrome 128 · Windows 11" : "Chrome 128 · Barangay workstation",
      reason: denied ? "Purpose was missing. Access stopped before the record opened." : template.reason,
      result,
      sensitivity: template.sensitivity,
      changes:
        template.action === "Updated"
          ? [
              {
                field: eventIndex === 0 ? "Occupation" : "Indicative cost",
                before: eventIndex === 0 ? "Self-employed" : "₱1,850,000",
                after: eventIndex === 0 ? "Fishing operator" : "₱2,100,000",
              },
              { field: "Last verified", before: "2026-06-15", after: "2026-09-23" },
            ]
          : [],
      integrityHash: hashFor(sequence, barangay.code, template.module),
    };
  });
});

const municipalEvents: AuditEvent[] = ACCESS_ACCOUNTS.filter((account) => account.barangayId === null).flatMap(
  (account, accountIndex) =>
    [0, 1, 2].map((eventIndex) => {
      const sequence = barangayEvents.length + accountIndex * 3 + eventIndex + 1;
      const actions: AuditAction[] = ["Sign-in", "Viewed", "Exported"];
      const result: AuditResult = accountIndex === 3 && eventIndex === 0 ? "Failed" : "Success";
      return {
        id: `AUD-2026-${String(sequence).padStart(6, "0")}`,
        sequence,
        occurredAt: `2026-09-${23 - eventIndex}T${10 + accountIndex}:${15 + eventIndex}:00+08:00`,
        actorId: account.id,
        action: actions[eventIndex],
        module: eventIndex === 0 ? "Authentication" : eventIndex === 1 ? "Municipal Oversight" : "Reports & Analytics",
        recordType: eventIndex === 0 ? "User session" : eventIndex === 1 ? "Barangay scorecard" : "Consolidated report",
        recordId: eventIndex === 0 ? `SESSION-${accountIndex + 1}` : `MUN-${String(sequence).padStart(5, "0")}`,
        barangayId: null,
        ipAddress: `10.62.0.${10 + accountIndex}`,
        device: "Chrome 128 · Municipal workstation",
        reason:
          result === "Failed"
            ? "Sign-in rejected after invalid password attempts."
            : eventIndex === 0
              ? "Authorized staff sign-in."
              : "Municipal oversight and statutory reporting.",
        result,
        sensitivity: eventIndex === 1 ? "Confidential" : "Standard",
        changes: [],
        integrityHash: hashFor(sequence, "0000000000", "Municipal"),
      };
    }),
);

export const AUDIT_EVENTS: AuditEvent[] = [...municipalEvents, ...barangayEvents].sort((a, b) =>
  b.occurredAt.localeCompare(a.occurredAt),
);
export const AUDIT_MODULES = [...new Set(AUDIT_EVENTS.map((event) => event.module))].sort();
