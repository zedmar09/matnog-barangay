import type { BlotterRecord } from "../types/blotter";
import type { JusticeCase, JusticeStage } from "../types/justice";

const stages: JusticeStage[] = [
  "For Summons",
  "Lupon Conciliation",
  "Pangkat Hearing",
  "Settlement",
  "Repudiation Period",
  "For CFA",
  "CFA Issued",
  "Closed",
];

const officers = ["Punong Barangay Elena Ramos", "Lupon Chairperson Mario Santos", "Barangay Kagawad Liza Garcia"];

export function createJusticeDummyData(blotterRecords: BlotterRecord[]): JusticeCase[] {
  return blotterRecords.slice(0, 72).map((record, index) => {
    const stage = stages[index % stages.length];
    const filedAt = `2026-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}T08:30:00.000Z`;
    const hearingCount = stage === "For Summons" ? 0 : stage === "Lupon Conciliation" ? 1 : 2;
    const outcome = ["Settlement", "Repudiation Period", "Closed"].includes(stage)
      ? "Settled"
      : ["For CFA", "CFA Issued"].includes(stage)
        ? "Failed"
        : "";
    return {
      id: `justice-${String(index + 1).padStart(5, "0")}`,
      caseNumber: `KP-${record.barangayId.toUpperCase()}-2026-${String(index + 1).padStart(4, "0")}`,
      barangayId: record.barangayId,
      sourceBlotterId: record.id,
      sourceBlotterNumber: record.caseNumber,
      subject: record.incidentType,
      complainant: record.complainant,
      respondent: record.respondent,
      filedAt,
      stage,
      statutoryDeadline: `2026-${String((index % 8) + 2).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}T17:00:00.000Z`,
      luponChairperson: officers[index % officers.length],
      pangkatMembers: ["Lupon Member Ana Cruz", "Lupon Member Pedro Flores", "Lupon Member Rosa Mendoza"],
      hearings: Array.from({ length: hearingCount }, (_, hearingIndex) => ({
        id: `hearing-${index + 1}-${hearingIndex + 1}`,
        type: hearingIndex === 0 ? "Lupon Conciliation" : "Pangkat Hearing",
        scheduledAt: `2026-${String((index % 8) + 2).padStart(2, "0")}-${String((index % 20) + 5 + hearingIndex).padStart(2, "0")}T09:00:00.000Z`,
        venue: "Barangay Hall Mediation Room",
        status: hearingIndex < hearingCount - 1 || outcome ? "Completed" : "Scheduled",
        complainantSummons: "Served",
        respondentSummons: index % 11 === 0 ? "Failed Service" : "Served",
        notes:
          hearingIndex < hearingCount - 1 || outcome
            ? "Parties appeared and proceedings were recorded."
            : "Awaiting scheduled appearance.",
      })),
      outcome,
      settlementTerms:
        outcome === "Settled" ? "The parties voluntarily agreed to comply with the recorded settlement terms." : "",
      repudiationDeadline: stage === "Repudiation Period" ? "2026-10-03T17:00:00.000Z" : "",
      cfaNumber:
        stage === "CFA Issued"
          ? `CFA-${record.barangayId.toUpperCase()}-2026-${String(index + 1).padStart(4, "0")}`
          : "",
      cfaIssuedAt: stage === "CFA Issued" ? "2026-09-18T10:30:00.000Z" : "",
      auditTrail: [
        {
          id: `justice-audit-${index + 1}-1`,
          action: "KP complaint filed",
          actor: "Barangay Justice Desk Officer",
          note: `Created from ${record.caseNumber}.`,
          occurredAt: filedAt,
        },
        ...(stage === "For Summons"
          ? []
          : [
              {
                id: `justice-audit-${index + 1}-2`,
                action: stage,
                actor: officers[index % officers.length],
                note: "Case workflow advanced after review of the proceedings.",
                occurredAt: "2026-09-16T11:00:00.000Z",
              },
            ]),
      ],
    };
  });
}
