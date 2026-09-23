import type { DuplicateCandidate, DuplicateRisk, Resident } from "../types/resident";

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
