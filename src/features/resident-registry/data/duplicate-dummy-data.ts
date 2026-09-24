import type { DuplicateCandidate, DuplicateRisk, MergeLog, Resident } from "../types/resident";

function riskFor(score: number): DuplicateRisk {
  if (score >= 90) return "Very High";
  if (score >= 75) return "High";
  return "Possible";
}

export function createDuplicateCandidates(residents: Resident[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  let sequence = 1;
  for (let targetIndex = 49; targetIndex < residents.length; targetIndex += 31) {
    const residentA = residents[targetIndex - 7];
    const residentB = residents[targetIndex];
    if (!residentA || !residentB) continue;
    const signals = ["Normalized legal name", "Birth date", "Mother’s maiden name"];
    let score = 75;
    if (residentA.contact.primaryMobile && residentA.contact.primaryMobile === residentB.contact.primaryMobile) {
      signals.push("Primary mobile number");
      score += 10;
    }
    if (residentA.address.purok === residentB.address.purok) {
      signals.push("Household / address association");
      score += 15;
    } else if (residentA.birthMunicipality === residentB.birthMunicipality) {
      signals.push("Birth municipality");
      score += 8;
    }
    score = Math.min(100, score);
    candidates.push({
      id: `duplicate-${String(sequence).padStart(4, "0")}`,
      residentAId: residentA.id,
      residentBId: residentB.id,
      score,
      risk: riskFor(score),
      signals,
      status: sequence % 9 === 0 ? "Deferred" : "Pending Review",
      detectedAt: new Date(Date.UTC(2026, 8, 23 - (sequence % 18))).toISOString(),
      reviewer: sequence % 9 === 0 ? "Barangay Admin" : "",
      reviewedAt: "",
      note: sequence % 9 === 0 ? "Waiting for supporting identity document." : "",
    });
    sequence += 1;
  }
  return candidates;
}

const mergeReasons = [
  "Confirmed same individual via birth certificate match",
  "Matching PhilSys biometric reference",
  "Same person registered in two barangays during transfer",
  "Duplicate entry from manual census encoding",
  "Verified by barangay captain — same household member",
  "Matching government-issued ID presented at counter",
];

const reversalReasons = [
  "Records belong to father and son with same name",
  "Error in identity verification — different birth dates confirmed",
  "Resident contested merge; provided supporting documents",
];

const reviewers = ["Maria Santos", "Juan Dela Cruz", "Barangay Admin", "Ana Reyes", "Pedro Aquino"];

export function createMergeLogs(residents: Resident[]): MergeLog[] {
  const logs: MergeLog[] = [];
  for (let i = 0; i < 8; i++) {
    const aIdx = 20 + i * 40;
    const bIdx = aIdx + 3;
    const a = residents[aIdx];
    const b = residents[bIdx];
    if (!a || !b) continue;
    const isReversed = i === 2 || i === 5;
    const mergedDate = new Date(Date.UTC(2026, 7 + (i % 2), 5 + i * 2));
    logs.push({
      id: `merge-${String(i + 1).padStart(4, "0")}`,
      candidateId: `duplicate-merge-${String(i + 1).padStart(4, "0")}`,
      survivingResidentId: a.id,
      retiredResidentId: b.id,
      survivingLrn: a.lrn,
      retiredLrn: b.lrn,
      reviewer: reviewers[i % reviewers.length],
      reason: mergeReasons[i % mergeReasons.length],
      mergedAt: mergedDate.toISOString(),
      reversedAt: isReversed ? new Date(mergedDate.getTime() + 5 * 86400000).toISOString() : "",
      reversalReason: isReversed ? reversalReasons[i % reversalReasons.length] : "",
      beforeSurvivor: a,
      beforeRetired: b,
      fieldSelections: { firstName: "a", lastName: "a", birthDate: "a", gender: "a", primaryMobile: "b" },
    });
  }
  return logs;
}
