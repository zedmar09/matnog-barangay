import type { Resident, ResidentIdCard, ResidentIdentityMedia } from "../types/resident";

export function createResidentIdDummyData(residents: Resident[], media: ResidentIdentityMedia[]): ResidentIdCard[] {
  const eligible = residents
    .filter((resident) => {
      const item = media.find((entry) => entry.residentId === resident.id);
      return Boolean(item?.photoUrl) && Boolean(item?.signatureUrl);
    })
    .slice(0, 600);
  const primary = eligible.map((resident, index) => {
    const statuses: ResidentIdCard["status"][] = [
      "Released",
      "Released",
      "Released",
      "Printed",
      "Generated",
      "Expired",
      "Revoked",
      "Lost",
      "Replaced",
    ];
    const status = statuses[index % statuses.length];
    const issued = `202${index % 6}-${String(1 + (index % 12)).padStart(2, "0")}-15`;
    return {
      id: `resident-id-${String(index + 1).padStart(5, "0")}`,
      cardNumber: `MID-2026-${String(index + 1).padStart(7, "0")}`,
      residentId: resident.id,
      barangayId: resident.address.barangayId,
      verificationToken: `matnog-rid-${String(index + 1).padStart(10, "0")}-${(index * 7919 + 104729).toString(36)}`,
      status,
      issueDate: issued,
      expirationDate:
        status === "Expired" ? "2025-12-31" : `${2027 + (index % 5)}-${String(1 + (index % 12)).padStart(2, "0")}-15`,
      emergencyContactName: `${resident.middleName || "Maria"} ${resident.lastName}`,
      emergencyContactNumber: resident.contact.secondaryMobile || resident.contact.primaryMobile || "09170000000",
      issuingAuthority: "Municipality of Matnog",
      generatedBy: "Barangay Registration Staff",
      generatedAt: `${issued}T09:00:00.000Z`,
      printedBy: ["Printed", "Released", "Expired", "Revoked", "Lost", "Replaced"].includes(status)
        ? "Municipal ID Officer"
        : "",
      printedAt: ["Printed", "Released", "Expired", "Revoked", "Lost", "Replaced"].includes(status)
        ? `${issued}T14:00:00.000Z`
        : "",
      releasedTo: ["Released", "Expired", "Revoked", "Lost", "Replaced"].includes(status) ? resident.firstName : "",
      releasedBy: ["Released", "Expired", "Revoked", "Lost", "Replaced"].includes(status)
        ? "Barangay Releasing Staff"
        : "",
      releasedAt: ["Released", "Expired", "Revoked", "Lost", "Replaced"].includes(status)
        ? `${issued}T16:00:00.000Z`
        : "",
      replacementForId: "",
      actionReason:
        status === "Revoked"
          ? "Resident record status changed."
          : status === "Lost"
            ? "Reported lost by the resident."
            : status === "Replaced"
              ? "Card replaced due to damaged print."
              : "",
      updatedAt: `${issued}T16:00:00.000Z`,
    };
  });
  const pending = eligible.slice(0, 120).map((resident, index) => ({
    id: `resident-id-pending-${String(index + 1).padStart(4, "0")}`,
    cardNumber: `MID-PENDING-${String(index + 1).padStart(5, "0")}`,
    residentId: resident.id,
    barangayId: resident.address.barangayId,
    verificationToken: `matnog-rid-pending-${String(index + 1).padStart(8, "0")}`,
    status: "Pending Generation" as const,
    issueDate: "2026-09-23",
    expirationDate: "2031-09-23",
    emergencyContactName: `${resident.middleName || "Maria"} ${resident.lastName}`,
    emergencyContactNumber: resident.contact.primaryMobile || "09170000000",
    issuingAuthority: "Municipality of Matnog",
    generatedBy: "",
    generatedAt: "",
    printedBy: "",
    printedAt: "",
    releasedTo: "",
    releasedBy: "",
    releasedAt: "",
    replacementForId: primary[index]?.id ?? "",
    actionReason: "Scheduled replacement or first issuance",
    updatedAt: "2026-09-23T08:00:00.000Z",
  }));
  return [...pending, ...primary];
}
