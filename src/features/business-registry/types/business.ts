export type BusinessStatus = "Active" | "For renewal" | "Lapsed" | "Closed";
export type ClearanceStatus = "Valid" | "Pending" | "Expired" | "Not issued";
export type BusinessOwnership = "Sole proprietorship" | "Partnership" | "Corporation" | "Cooperative";
export type BusinessPaymentMethod = "Cash" | "GCash" | "Bank transfer" | "Check";

export type BusinessPayment = {
  id: string;
  receiptNumber: string;
  businessId: string;
  amount: number;
  paymentMethod: BusinessPaymentMethod;
  referenceNumber: string;
  paymentDate: string;
  collector: string;
};

export type BusinessRecord = {
  id: string;
  businessNumber: string;
  businessName: string;
  tradeName: string;
  businessType: string;
  ownership: BusinessOwnership;
  ownerResidentId: string;
  structureId: string;
  barangayId: string;
  contactNumber: string;
  email: string;
  grossSalesBracket: string;
  employeeCount: number;
  status: BusinessStatus;
  clearanceStatus: ClearanceStatus;
  clearanceNumber: string;
  clearanceValidUntil: string;
  assessedFee: number;
  amountPaid: number;
  lastPaymentDate: string;
  registrationDate: string;
  renewalDueDate: string;
  bplsPermitNumber: string;
  bplsSyncStatus: "Synced" | "Pending" | "Needs review";
  updatedAt: string;
};

export type NewBusinessInput = Pick<
  BusinessRecord,
  | "businessName"
  | "tradeName"
  | "businessType"
  | "ownership"
  | "ownerResidentId"
  | "structureId"
  | "barangayId"
  | "contactNumber"
  | "email"
  | "grossSalesBracket"
  | "employeeCount"
>;
