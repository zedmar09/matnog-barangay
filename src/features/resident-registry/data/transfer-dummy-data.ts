import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { ResidencyEntry, Resident, TransferStatus, TransferTransaction } from "../types/resident";

const statuses: TransferStatus[] = [
  "Requested",
  "Awaiting Acceptance",
  "Accepted",
  "Accepted",
  "Rejected",
  "Clarification Requested",
  "Cancelled",
];

const isoDate = (daysAgo: number) => {
  const date = new Date(Date.UTC(2026, 8, 23 - daysAgo, 8, 0, 0));
  return date.toISOString();
};

export function createTransferDummyData(residents: Resident[], count = 160): TransferTransaction[] {
  return Array.from({ length: count }, (_, index) => {
    const resident = residents[(index * 7 + 13) % residents.length];
    const currentIndex = MATNOG_BARANGAYS.findIndex((barangay) => barangay.code === resident.address.barangayId);
    const other = MATNOG_BARANGAYS[(currentIndex + 1 + (index % 11)) % MATNOG_BARANGAYS.length];
    const status = statuses[index % statuses.length];
    const accepted = status === "Accepted";
    const originBarangayId = accepted ? other.code : resident.address.barangayId;
    const destinationBarangayId = accepted ? resident.address.barangayId : other.code;
    const requestedAt = isoDate(2 + index);
    const releasedAt = ["Awaiting Acceptance", "Accepted", "Rejected", "Clarification Requested"].includes(status)
      ? isoDate(1 + index)
      : "";
    const reviewedAt = ["Accepted", "Rejected", "Clarification Requested"].includes(status) ? isoDate(index) : "";
    return {
      id: `transfer-${String(index + 1).padStart(4, "0")}`,
      referenceNumber: `TRF-2026-${String(index + 1).padStart(5, "0")}`,
      residentId: resident.id,
      originBarangayId,
      destinationBarangayId,
      requestedEffectiveDate: requestedAt.slice(0, 10),
      reason: ["Permanent relocation", "Family reunification", "Employment relocation", "Return to family residence"][
        index % 4
      ],
      supportingDocumentCount: index % 4,
      status,
      requestedBy: "Barangay Registration Staff",
      requestedAt,
      releasedBy: releasedAt ? "Origin Barangay Admin" : "",
      releasedAt,
      reviewedBy: reviewedAt ? "Destination Barangay Admin" : "",
      reviewedAt,
      completedAt: accepted ? reviewedAt : "",
      decisionReason:
        status === "Rejected"
          ? "Destination residency evidence requires correction."
          : status === "Clarification Requested"
            ? "Please confirm the complete destination address."
            : status === "Cancelled"
              ? "Transfer request withdrawn by the resident."
              : accepted
                ? "Destination residency verified and accepted."
                : "",
      updatedAt: reviewedAt || releasedAt || requestedAt,
    };
  });
}

export function createResidencyHistory(residents: Resident[]): ResidencyEntry[] {
  return residents.flatMap((resident, index) => {
    const current: ResidencyEntry = {
      id: `residency-current-${resident.id}`,
      residentId: resident.id,
      barangayId: resident.address.barangayId,
      startDate: `202${index % 6}-${String(1 + (index % 12)).padStart(2, "0")}-01`,
      endDate: "",
      transferId: "",
      status: "Current",
      processedBy: "Barangay Registration Staff",
      remarks: "Current registered residence",
    };
    if (index % 4 !== 0) return [current];
    const currentIndex = MATNOG_BARANGAYS.findIndex((barangay) => barangay.code === resident.address.barangayId);
    const previous = MATNOG_BARANGAYS[(currentIndex + MATNOG_BARANGAYS.length - 1) % MATNOG_BARANGAYS.length];
    const historical: ResidencyEntry = {
      id: `residency-history-${resident.id}`,
      residentId: resident.id,
      barangayId: previous.code,
      startDate: "2018-01-01",
      endDate: current.startDate,
      transferId: `TRF-HIST-${String(index + 1).padStart(5, "0")}`,
      status: "Historical",
      processedBy: "Municipal Registry Officer",
      remarks: "Previous barangay residence",
    };
    return [current, historical];
  });
}
