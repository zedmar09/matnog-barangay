import type { HouseholdStructure } from "@/features/household-registry/types/household";
import type { Resident } from "@/features/resident-registry/types/resident";

import type { BusinessPayment, BusinessRecord } from "../types/business";

export const BUSINESS_TYPES = [
  "Sari-sari Store",
  "Retail and Trading",
  "Food Service",
  "Agriculture and Fisheries",
  "Transport Service",
  "Tourism and Accommodation",
  "Construction Service",
  "Professional Service",
  "Manufacturing",
  "Personal Care Service",
  "Internet and Technology",
  "Other Service",
];

export const GROSS_SALES_BRACKETS = [
  "Below ₱100,000",
  "₱100,000 – ₱250,000",
  "₱250,001 – ₱500,000",
  "₱500,001 – ₱1,000,000",
  "₱1,000,001 – ₱3,000,000",
  "Above ₱3,000,000",
];

const prefixes = ["Matnog", "Pacific", "Mayon", "Seaside", "Bicol", "Maharlika", "San Roque", "Coastal"];
const nouns = ["Trading", "General Merchandise", "Eatery", "Agri Supply", "Transport", "Lodge", "Builders", "Services"];
const ownerships = ["Sole proprietorship", "Sole proprietorship", "Partnership", "Corporation", "Cooperative"] as const;
const statuses = ["Active", "Active", "Active", "For renewal", "Lapsed", "Active"] as const;
const businessTypeDistribution = [78, 55, 44, 39, 32, 27, 23, 20, 15, 11, 9, 7];
const registrationMonthDistribution = [18, 22, 24, 30, 34, 38, 41, 45, 52, 24, 18, 14];
const grossSalesDistribution = [132, 88, 61, 39, 25, 15];

function businessTypeForIndex(index: number) {
  let boundary = 0;
  for (let typeIndex = 0; typeIndex < BUSINESS_TYPES.length; typeIndex += 1) {
    boundary += businessTypeDistribution[typeIndex];
    if (index < boundary) return BUSINESS_TYPES[typeIndex];
  }
  return BUSINESS_TYPES[BUSINESS_TYPES.length - 1];
}

function registrationMonthForIndex(index: number) {
  let boundary = 0;
  for (let monthIndex = 0; monthIndex < registrationMonthDistribution.length; monthIndex += 1) {
    boundary += registrationMonthDistribution[monthIndex];
    if (index < boundary) return monthIndex + 1;
  }
  return 12;
}

function grossSalesBracketForIndex(index: number) {
  let boundary = 0;
  for (let bracketIndex = 0; bracketIndex < grossSalesDistribution.length; bracketIndex += 1) {
    boundary += grossSalesDistribution[bracketIndex];
    if (index < boundary) return GROSS_SALES_BRACKETS[bracketIndex];
  }
  return GROSS_SALES_BRACKETS[GROSS_SALES_BRACKETS.length - 1];
}

export function createBusinessDummyData(residents: Resident[], structures: HouseholdStructure[]) {
  const businesses: BusinessRecord[] = Array.from({ length: 360 }, (_, index) => {
    const owner = residents[(index * 17 + 5) % residents.length];
    const barangayStructures = structures.filter((item) => item.barangayId === owner.address.barangayId);
    const structure = barangayStructures[index % barangayStructures.length] ?? structures[index % structures.length];
    const status = statuses[index % statuses.length];
    const needsInitialAssessment = status === "Active" && index % 19 === 0;
    const clearanceStatus = needsInitialAssessment
      ? "Not issued"
      : status === "Lapsed"
        ? "Expired"
        : status === "For renewal"
          ? "Pending"
          : "Valid";
    const year = index % 8 === 0 ? 2025 : 2026;
    const assessedFee = needsInitialAssessment ? 0 : 300 + (index % 9) * 150;
    const amountPaid =
      clearanceStatus === "Valid"
        ? assessedFee
        : clearanceStatus === "Pending"
          ? index % 12 === 3
            ? assessedFee
            : assessedFee / 2
          : 0;
    const businessType = businessTypeForIndex(index);
    return {
      id: `business-${String(index + 1).padStart(5, "0")}`,
      businessNumber: `BR-${owner.address.barangayId.toUpperCase()}-${String(index + 1).padStart(5, "0")}`,
      businessName: `${prefixes[index % prefixes.length]} ${nouns[(index * 3) % nouns.length]}`,
      tradeName: index % 4 === 0 ? `${prefixes[(index + 2) % prefixes.length]} ${businessType}` : "",
      businessType,
      ownership: ownerships[index % ownerships.length],
      ownerResidentId: owner.id,
      structureId: structure.id,
      barangayId: owner.address.barangayId,
      contactNumber: `09${String(170000000 + index * 7919).slice(-9)}`,
      email: index % 3 === 0 ? `business${index + 1}@example.ph` : "",
      grossSalesBracket: grossSalesBracketForIndex(index),
      employeeCount: 1 + (index % 18),
      status,
      clearanceStatus,
      clearanceNumber: needsInitialAssessment ? "" : `BC-2026-${String(index + 1).padStart(6, "0")}`,
      clearanceValidUntil:
        clearanceStatus === "Valid" ? "2026-12-31" : clearanceStatus === "Expired" ? "2025-12-31" : "",
      assessedFee,
      amountPaid,
      lastPaymentDate: amountPaid ? `2026-0${(index % 9) + 1}-${String((index % 25) + 1).padStart(2, "0")}` : "",
      registrationDate: `${year}-${String(registrationMonthForIndex(index)).padStart(2, "0")}-${String((index % 25) + 1).padStart(2, "0")}`,
      renewalDueDate: status === "Lapsed" ? "2026-01-20" : status === "For renewal" ? "2026-10-15" : "2027-01-20",
      bplsPermitNumber: index % 5 === 0 ? "" : `BPLS-26-${String(index + 1300).padStart(6, "0")}`,
      bplsSyncStatus: index % 11 === 0 ? "Needs review" : index % 5 === 0 ? "Pending" : "Synced",
      updatedAt: `2026-09-${String((index % 23) + 1).padStart(2, "0")}T08:30:00.000Z`,
    };
  });
  const payments: BusinessPayment[] = businesses
    .filter((business) => business.amountPaid > 0)
    .map((business, index) => ({
      id: `business-payment-${String(index + 1).padStart(5, "0")}`,
      receiptNumber: `OR-2026-${String(index + 1001).padStart(6, "0")}`,
      businessId: business.id,
      amount: business.amountPaid,
      paymentMethod: index % 8 === 0 ? "GCash" : index % 13 === 0 ? "Bank transfer" : "Cash",
      referenceNumber: index % 8 === 0 ? `GC-${String(824000000 + index * 137).slice(-9)}` : "",
      paymentDate: business.lastPaymentDate,
      collector: index % 3 === 0 ? "Maria Dela Cruz" : index % 3 === 1 ? "Jose Reyes" : "Ana Santos",
    }));
  return { businesses, payments };
}
