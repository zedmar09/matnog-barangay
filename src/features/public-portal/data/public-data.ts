import { MATNOG_BARANGAYS } from "@/data/barangays";

export type PublicProject = {
  id: string;
  barangayId: string;
  title: string;
  category: string;
  status: "Planning" | "Procurement" | "In progress" | "Completed";
  completion: number;
  budget: number;
  contractor: string;
  fundSource: string;
  fiscalYear: number;
  startDate: string;
  targetDate: string;
  description: string;
  beneficiaries: number;
  updates: Array<{ date: string; title: string; detail: string; completion: number }>;
  photos: Array<{ id: string; caption: string; capturedAt: string }>;
};

export type PublicNotice = {
  id: string;
  barangayId: string;
  type: "Public advisory" | "Procurement" | "Financial report" | "Council notice";
  title: string;
  publishedAt: string;
};

export type PublicBarangayProfile = {
  code: string;
  name: string;
  classification: "Coastal" | "Inland" | "Urban center";
  populationEstimate: number;
  householdEstimate: number;
  landAreaHectares: number;
  sitios: number;
  address: string;
  officePhone: string;
  officeEmail: string;
  officeHours: string;
  about: string;
};

export type PublicOfficial = {
  id: string;
  scope: "municipal" | "barangay";
  barangayId: string;
  name: string;
  role: string;
  committee: string;
  term: string;
  officeEmail: string;
};

export type PublicFundRecord = {
  id: string;
  barangayId: string;
  fiscalYear: number;
  fund: "General Fund" | "Development Fund" | "DRRM Fund" | "GAD Fund" | "SK Fund";
  appropriated: number;
  obligated: number;
  disbursed: number;
};

export type PublicTransparencyDocument = {
  id: string;
  barangayId: string;
  fiscalYear: number;
  type: "Annual Budget" | "Financial Statement" | "Fund Utilization" | "Procurement Plan" | "Accomplishment Report";
  title: string;
  period: string;
  publishedAt: string;
  format: "PDF" | "XLSX";
  pages: number;
  status: "Published" | "Superseded";
};

export type PublicProcurementNotice = {
  id: string;
  barangayId: string;
  fiscalYear: number;
  reference: string;
  title: string;
  stage: "Invitation to Bid" | "Request for Quotation" | "Notice of Award";
  procurementMode: "Public Bidding" | "Small Value Procurement";
  approvedBudget: number;
  postedAt: string;
  closingAt: string;
  status: "Open" | "Awarded" | "Closed";
};

const projectTemplates = [
  ["Potable Water System Improvement", "Infrastructure"],
  ["Solar Street Lighting Program", "Public safety"],
  ["Barangay Health Station Upgrade", "Health"],
  ["Coastal Livelihood Support Facility", "Livelihood"],
] as const;

const projectStatuses = ["In progress", "Procurement", "Planning", "Completed"] as const;
const contractors = [
  "Matnog Community Builders Cooperative",
  "Sorsogon Pacific Construction",
  "Bicol Prime Engineering Services",
  "San Bernardino Development Corporation",
] as const;
const fundSources = ["20% Development Fund", "General Fund", "Local DRRM Fund", "External Grant"] as const;

export const PUBLIC_PROJECTS: PublicProject[] = MATNOG_BARANGAYS.flatMap((barangay, barangayIndex) =>
  Array.from({ length: 2 }, (_, projectIndex) => {
    const template = projectTemplates[(barangayIndex + projectIndex) % projectTemplates.length];
    const status = projectStatuses[(barangayIndex + projectIndex) % projectStatuses.length];
    const completion = status === "Completed" ? 100 : status === "In progress" ? 38 + ((barangayIndex * 9) % 52) : 0;
    const fiscalYear = barangayIndex % 7 === 0 && projectIndex === 1 ? 2025 : 2026;
    const startMonth = 1 + ((barangayIndex + projectIndex * 2) % 8);
    const projectId = `PUB-PRJ-${String(barangayIndex * 2 + projectIndex + 1).padStart(4, "0")}`;
    return {
      id: projectId,
      barangayId: barangay.code,
      title: template[0],
      category: template[1],
      status,
      completion,
      budget: 480_000 + ((barangayIndex * 173_000 + projectIndex * 290_000) % 3_900_000),
      contractor:
        status === "Planning" ? "For procurement" : contractors[(barangayIndex + projectIndex) % contractors.length],
      fundSource: fundSources[(barangayIndex + projectIndex * 2) % fundSources.length],
      fiscalYear,
      startDate: `${fiscalYear}-${String(startMonth).padStart(2, "0")}-${String(4 + (barangayIndex % 18)).padStart(2, "0")}`,
      targetDate: `2026-${String(10 + ((barangayIndex + projectIndex) % 3)).padStart(2, "0")}-${String(12 + (barangayIndex % 15)).padStart(2, "0")}`,
      description: `${template[0]} supports safer, more reliable community services in Barangay ${barangay.name}. Published information includes approved funding, delivery status, and validated progress updates.`,
      beneficiaries: 180 + ((barangayIndex * 127 + projectIndex * 211) % 2_400),
      updates: [
        {
          date: `${fiscalYear}-${String(startMonth).padStart(2, "0")}-${String(4 + (barangayIndex % 18)).padStart(2, "0")}`,
          title: "Project record published",
          detail: "Approved project information and funding source were added to the public portal.",
          completion: 0,
        },
        ...(status === "In progress" || status === "Completed"
          ? [
              {
                date: `2026-08-${String(6 + (barangayIndex % 18)).padStart(2, "0")}`,
                title: "Progress inspection validated",
                detail: "The latest physical accomplishment was inspected and accepted for public reporting.",
                completion,
              },
            ]
          : []),
      ],
      photos:
        status === "In progress" || status === "Completed"
          ? [
              { id: `${projectId}-photo-1`, caption: "Validated project site overview", capturedAt: "2026-08-12" },
              { id: `${projectId}-photo-2`, caption: "Current physical accomplishment", capturedAt: "2026-09-05" },
              { id: `${projectId}-photo-3`, caption: "Community access and work area", capturedAt: "2026-09-18" },
            ]
          : [],
    };
  }),
);

export const PUBLIC_NOTICES: PublicNotice[] = [
  {
    id: "NOTICE-001",
    barangayId: "all",
    type: "Public advisory",
    title: "Municipal services schedule for the fourth quarter",
    publishedAt: "2026-09-22",
  },
  {
    id: "NOTICE-002",
    barangayId: "all",
    type: "Financial report",
    title: "2026 second-quarter fund utilization summary published",
    publishedAt: "2026-09-18",
  },
  ...MATNOG_BARANGAYS.map((barangay, index) => ({
    id: `NOTICE-${String(index + 3).padStart(3, "0")}`,
    barangayId: barangay.code,
    type: (index % 3 === 0
      ? "Procurement"
      : index % 3 === 1
        ? "Council notice"
        : "Public advisory") as PublicNotice["type"],
    title:
      index % 3 === 0
        ? `Invitation to bid for ${barangay.name} community improvements`
        : index % 3 === 1
          ? `${barangay.name} regular council session notice`
          : `${barangay.name} community service advisory`,
    publishedAt: `2026-09-${String(21 - (index % 16)).padStart(2, "0")}`,
  })),
];

const firstNames = [
  "Antonio",
  "Maria Elena",
  "Rogelio",
  "Lourdes",
  "Jose Manuel",
  "Cecilia",
  "Ramon",
  "Teresa",
  "Victor",
  "Rosalinda",
  "Edgar",
  "Lorna",
  "Francisco",
  "Marites",
  "Roberto",
  "Evelyn",
] as const;

const lastNames = [
  "Dela Cruz",
  "Escoto",
  "Frilles",
  "Guban",
  "Hao",
  "Labrador",
  "Llaneta",
  "Mella",
  "Nobleza",
  "Oropesa",
  "Pura",
  "Rañola",
  "Sarmiento",
  "Tañada",
  "Vargas",
  "Yuson",
] as const;

const barangayRoles = [
  ["Punong Barangay", "Executive and general administration"],
  ["Barangay Kagawad", "Appropriations and finance"],
  ["Barangay Kagawad", "Health and sanitation"],
  ["Barangay Kagawad", "Peace and order"],
  ["Barangay Kagawad", "Infrastructure and public works"],
  ["Barangay Kagawad", "Education, culture, and youth"],
  ["Barangay Secretary", "Records and council administration"],
  ["Barangay Treasurer", "Treasury and collections"],
] as const;

export const PUBLIC_BARANGAY_PROFILES: PublicBarangayProfile[] = MATNOG_BARANGAYS.map((barangay, index) => ({
  code: barangay.code,
  name: barangay.name,
  classification: index % 5 === 0 ? "Urban center" : index % 2 === 0 ? "Coastal" : "Inland",
  populationEstimate: 1_180 + ((index * 317) % 4_720),
  householdEstimate: 268 + ((index * 73) % 936),
  landAreaHectares: 124 + ((index * 47) % 580),
  sitios: 4 + (index % 9),
  address: `Barangay Hall, ${barangay.name}, Matnog, Sorsogon`,
  officePhone: `(056) 311-${String(4100 + index).padStart(4, "0")}`,
  officeEmail: `${barangay.name.toLowerCase().replaceAll(" ", ".").replaceAll("-", ".")}@matnog.gov.ph`,
  officeHours: "Monday–Friday, 8:00 AM–5:00 PM",
  about: `${barangay.name} is one of the 40 barangays of the Municipality of Matnog. This profile publishes community-level governance information, current projects, notices, and official office contacts.`,
}));

export const MUNICIPAL_OFFICIALS: PublicOfficial[] = [
  {
    id: "MUN-001",
    scope: "municipal",
    barangayId: "all",
    name: "Hon. Maria Elena Frilles",
    role: "Municipal Mayor",
    committee: "Office of the Municipal Mayor",
    term: "2025–2028",
    officeEmail: "mayor@matnog.gov.ph",
  },
  {
    id: "MUN-002",
    scope: "municipal",
    barangayId: "all",
    name: "Hon. Ramon Sarmiento",
    role: "Municipal Vice Mayor",
    committee: "Sangguniang Bayan",
    term: "2025–2028",
    officeEmail: "vice-mayor@matnog.gov.ph",
  },
  {
    id: "MUN-003",
    scope: "municipal",
    barangayId: "all",
    name: "Atty. Cecilia Nobleza",
    role: "Municipal Administrator",
    committee: "Municipal Administration",
    term: "Current appointment",
    officeEmail: "administrator@matnog.gov.ph",
  },
  {
    id: "MUN-004",
    scope: "municipal",
    barangayId: "all",
    name: "Engr. Roberto Mella",
    role: "Municipal Planning Officer",
    committee: "Planning and Development",
    term: "Current appointment",
    officeEmail: "planning@matnog.gov.ph",
  },
];

export const BARANGAY_OFFICIALS: PublicOfficial[] = MATNOG_BARANGAYS.flatMap((barangay, barangayIndex) =>
  barangayRoles.map(([role, committee], roleIndex) => {
    const firstName = firstNames[(barangayIndex * 3 + roleIndex) % firstNames.length];
    const lastName = lastNames[(barangayIndex + roleIndex * 2) % lastNames.length];
    return {
      id: `BRGY-OFF-${String(barangayIndex * barangayRoles.length + roleIndex + 1).padStart(4, "0")}`,
      scope: "barangay",
      barangayId: barangay.code,
      name:
        role.includes("Kagawad") || role === "Punong Barangay"
          ? `Hon. ${firstName} ${lastName}`
          : `${firstName} ${lastName}`,
      role,
      committee,
      term: role.includes("Barangay") ? "2023–2025 extended term" : "Current appointment",
      officeEmail: `barangay.${barangay.name.toLowerCase().replaceAll(" ", ".").replaceAll("-", ".")}@matnog.gov.ph`,
    } satisfies PublicOfficial;
  }),
);

const fundTypes: PublicFundRecord["fund"][] = ["General Fund", "Development Fund", "DRRM Fund", "GAD Fund", "SK Fund"];

export const PUBLIC_FUND_RECORDS: PublicFundRecord[] = MATNOG_BARANGAYS.flatMap((barangay, barangayIndex) =>
  [2025, 2026].flatMap((fiscalYear, yearIndex) =>
    fundTypes.map((fund, fundIndex) => {
      const appropriated =
        720_000 + ((barangayIndex * 281_000 + fundIndex * 437_000 + yearIndex * 190_000) % 4_800_000);
      const obligationRate = 0.58 + ((barangayIndex + fundIndex * 3 + yearIndex) % 32) / 100;
      const disbursementRate = 0.7 + ((barangayIndex * 2 + fundIndex + yearIndex) % 22) / 100;
      const obligated = Math.round(appropriated * Math.min(obligationRate, 0.93));
      return {
        id: `FUND-${fiscalYear}-${barangay.code}-${fundIndex + 1}`,
        barangayId: barangay.code,
        fiscalYear,
        fund,
        appropriated,
        obligated,
        disbursed: Math.round(obligated * Math.min(disbursementRate, 0.94)),
      } satisfies PublicFundRecord;
    }),
  ),
);

const documentTypes: PublicTransparencyDocument["type"][] = [
  "Annual Budget",
  "Financial Statement",
  "Fund Utilization",
  "Procurement Plan",
  "Accomplishment Report",
];

export const PUBLIC_TRANSPARENCY_DOCUMENTS: PublicTransparencyDocument[] = MATNOG_BARANGAYS.flatMap(
  (barangay, barangayIndex) =>
    documentTypes.map((type, typeIndex) => ({
      id: `TRN-${barangay.code}-${String(typeIndex + 1).padStart(2, "0")}`,
      barangayId: barangay.code,
      fiscalYear: typeIndex === 4 && barangayIndex % 4 === 0 ? 2025 : 2026,
      type,
      title: `${barangay.name} ${type} ${typeIndex === 1 || typeIndex === 2 ? "— Second Quarter" : "— FY 2026"}`,
      period: typeIndex === 1 || typeIndex === 2 ? "Q2 2026" : typeIndex === 4 ? "FY 2025" : "FY 2026",
      publishedAt: `2026-0${6 + (typeIndex % 3)}-${String(8 + (barangayIndex % 18)).padStart(2, "0")}`,
      format: typeIndex === 2 ? "XLSX" : "PDF",
      pages: typeIndex === 2 ? 1 : 8 + ((barangayIndex + typeIndex * 3) % 34),
      status: typeIndex === 4 && barangayIndex % 7 === 0 ? "Superseded" : "Published",
    })),
);

export const PUBLIC_PROCUREMENT_NOTICES: PublicProcurementNotice[] = MATNOG_BARANGAYS.flatMap(
  (barangay, barangayIndex) =>
    Array.from({ length: 2 }, (_, noticeIndex) => {
      const project = PUBLIC_PROJECTS.find(
        (candidate) =>
          candidate.barangayId === barangay.code &&
          candidate.id.endsWith(String(barangayIndex * 2 + noticeIndex + 1).padStart(4, "0")),
      );
      const stage =
        noticeIndex === 0 ? "Invitation to Bid" : barangayIndex % 3 === 0 ? "Notice of Award" : "Request for Quotation";
      const status = stage === "Notice of Award" ? "Awarded" : barangayIndex % 4 === 0 ? "Open" : "Closed";
      return {
        id: `PROC-${barangay.code}-${noticeIndex + 1}`,
        barangayId: barangay.code,
        fiscalYear: 2026,
        reference: `MAT-${barangay.code.slice(-4)}-2026-${String(noticeIndex + 1).padStart(2, "0")}`,
        title: project?.title ?? `${barangay.name} Community Facility Improvement`,
        stage,
        procurementMode: noticeIndex === 0 ? "Public Bidding" : "Small Value Procurement",
        approvedBudget: project?.budget ?? 650_000 + barangayIndex * 27_000,
        postedAt: `2026-09-${String(2 + (barangayIndex % 18)).padStart(2, "0")}`,
        closingAt: `2026-10-${String(5 + (barangayIndex % 18)).padStart(2, "0")}`,
        status,
      } satisfies PublicProcurementNotice;
    }),
);

export function profileForBarangay(code: string) {
  return PUBLIC_BARANGAY_PROFILES.find((profile) => profile.code === code);
}

export function officialsForScope(scope: string) {
  if (scope === "all") {
    const captains = BARANGAY_OFFICIALS.filter((official) => official.role === "Punong Barangay");
    return { municipal: MUNICIPAL_OFFICIALS, barangay: captains };
  }
  return {
    municipal: MUNICIPAL_OFFICIALS,
    barangay: BARANGAY_OFFICIALS.filter((official) => official.barangayId === scope),
  };
}

export function transparencyForScope(scope: string, fiscalYear: number) {
  const inScope = (barangayId: string) => scope === "all" || barangayId === scope;
  return {
    funds: PUBLIC_FUND_RECORDS.filter((record) => inScope(record.barangayId) && record.fiscalYear === fiscalYear),
    documents: PUBLIC_TRANSPARENCY_DOCUMENTS.filter(
      (document) => inScope(document.barangayId) && document.fiscalYear === fiscalYear,
    ),
    procurement: PUBLIC_PROCUREMENT_NOTICES.filter(
      (notice) => inScope(notice.barangayId) && notice.fiscalYear === fiscalYear,
    ),
  };
}

export function barangayName(barangayId: string) {
  return MATNOG_BARANGAYS.find((barangay) => barangay.code === barangayId)?.name ?? "Municipality of Matnog";
}

export function publicContentForScope(scope: string) {
  const projects =
    scope === "all" ? PUBLIC_PROJECTS : PUBLIC_PROJECTS.filter((project) => project.barangayId === scope);
  const notices =
    scope === "all"
      ? PUBLIC_NOTICES
      : PUBLIC_NOTICES.filter((notice) => notice.barangayId === "all" || notice.barangayId === scope);
  return { projects, notices };
}
