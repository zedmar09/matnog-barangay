import type { IdentityMediaReview, Resident, ResidentIdentityMedia } from "../types/resident";

function signatureDataUrl(index: number) {
  const y1 = 34 + (index % 9);
  const y2 = 22 + (index % 13);
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><rect width="300" height="100" fill="white"/><path d="M18 66 C48 ${y1}, 54 82, 86 48 S120 ${y2}, 143 57 S179 78, 205 43 S244 56, 281 37" fill="none" stroke="#243c3a" stroke-width="3" stroke-linecap="round"/><path d="M42 72 Q118 86 262 69" fill="none" stroke="#243c3a" stroke-width="1.5"/></svg>`)}`;
}

export function createIdentityMedia(residents: Resident[]): ResidentIdentityMedia[] {
  return residents.map((resident, index) => {
    const hasPhoto = Boolean(resident.photoUrl);
    const hasSignature = index % 10 < 5;
    const complete = hasPhoto && hasSignature;
    return {
      residentId: resident.id,
      photoUrl: resident.photoUrl,
      signatureUrl: hasSignature ? signatureDataUrl(index) : "",
      photoCapturedAt: hasPhoto ? `2026-0${1 + (index % 9)}-12T09:00:00.000Z` : "",
      signatureCapturedAt: hasSignature ? `2026-0${1 + (index % 9)}-12T09:05:00.000Z` : "",
      capturedBy: complete ? "Barangay Registration Staff" : "",
      status: complete ? (index % 11 === 0 ? "Pending Review" : "Verified") : "Missing",
      verifiedBy: complete && index % 11 !== 0 ? "Municipal Registry Officer" : "",
      verifiedAt: complete && index % 11 !== 0 ? `2026-0${1 + (index % 9)}-13T10:00:00.000Z` : "",
    };
  });
}

export function createIdentityMediaReviews(
  residents: Resident[],
  media: ResidentIdentityMedia[],
  count = 100,
): IdentityMediaReview[] {
  const eligibleResidents = residents.filter((resident) => resident.residentStatus === "Active");
  return Array.from({ length: count }, (_, index) => {
    const resident = eligibleResidents[(index * 9 + 4) % eligibleResidents.length];
    const current = media.find((item) => item.residentId === resident.id);
    const statuses: IdentityMediaReview["status"][] = [
      "Pending Review",
      "Pending Review",
      "Approved",
      "Approved",
      "Recapture Required",
      "Rejected",
    ];
    const status = statuses[index % statuses.length];
    return {
      id: `media-review-${String(index + 1).padStart(4, "0")}`,
      referenceNumber: `MED-2026-${String(index + 1).padStart(5, "0")}`,
      residentId: resident.id,
      proposedPhotoUrl: current?.photoUrl || resident.photoUrl,
      proposedSignatureUrl: current?.signatureUrl || signatureDataUrl(index + 500),
      status,
      replacementReason:
        index % 3 === 0 ? "Initial identity media capture" : "Resident requested updated identity media",
      qualityNotes:
        index % 7 === 0 ? ["Review lighting", "Confirm face alignment"] : ["Framing passed", "Signature legible"],
      requestedBy: "Barangay Registration Staff",
      requestedAt: `2026-09-${String(1 + (index % 22)).padStart(2, "0")}T08:30:00.000Z`,
      reviewedBy: status === "Pending Review" ? "" : "Municipal Registry Officer",
      reviewedAt:
        status === "Pending Review" ? "" : `2026-09-${String(1 + (index % 22)).padStart(2, "0")}T13:00:00.000Z`,
      decisionReason:
        status === "Recapture Required"
          ? "Photo lighting is insufficient."
          : status === "Rejected"
            ? "Identity media does not match the resident record."
            : status === "Approved"
              ? "Photo and signature verified."
              : "",
    };
  });
}
