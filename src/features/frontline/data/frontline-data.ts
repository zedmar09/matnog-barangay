import type { Resident } from "@/features/resident-registry/types/resident";

import type { FrontlineFeedback, FrontlineService, FrontlineTicket, ServiceRequest } from "../types/frontline";

export const FRONTLINE_SERVICES: FrontlineService[] = [
  {
    id: "svc-clearance",
    code: "CLR",
    name: "Barangay Clearance",
    office: "Records Desk",
    targetMinutes: 15,
    color: "#168e83",
  },
  {
    id: "svc-residency",
    code: "RES",
    name: "Certificate of Residency",
    office: "Records Desk",
    targetMinutes: 15,
    color: "#347b9f",
  },
  {
    id: "svc-indigency",
    code: "IND",
    name: "Certificate of Indigency",
    office: "Social Services Desk",
    targetMinutes: 20,
    color: "#8a6b23",
  },
  {
    id: "svc-business",
    code: "BUS",
    name: "Business Clearance",
    office: "Business Desk",
    targetMinutes: 30,
    color: "#7863a5",
  },
  {
    id: "svc-cfa",
    code: "CFA",
    name: "Certificate to File Action",
    office: "Lupon Desk",
    targetMinutes: 25,
    color: "#a15d4d",
  },
  {
    id: "svc-jobseeker",
    code: "FTJ",
    name: "First-time Jobseeker",
    office: "Records Desk",
    targetMinutes: 20,
    color: "#397d62",
  },
  {
    id: "svc-resident",
    code: "RBI",
    name: "Resident Registration",
    office: "Registry Desk",
    targetMinutes: 25,
    color: "#2f7180",
  },
  {
    id: "svc-household",
    code: "HHU",
    name: "Household Record Update",
    office: "Registry Desk",
    targetMinutes: 25,
    color: "#5e7d43",
  },
  {
    id: "svc-assistance",
    code: "AID",
    name: "Assistance Inquiry",
    office: "Assistance Desk",
    targetMinutes: 20,
    color: "#a26d35",
  },
  {
    id: "svc-blotter",
    code: "BLT",
    name: "Blotter Filing",
    office: "Peace and Order Desk",
    targetMinutes: 35,
    color: "#9b4c54",
  },
  {
    id: "svc-vaw",
    code: "VAW",
    name: "VAW Desk Consultation",
    office: "VAW Desk",
    targetMinutes: 40,
    color: "#8e507d",
  },
  {
    id: "svc-feedback",
    code: "FDB",
    name: "Complaint or Feedback",
    office: "Public Assistance Desk",
    targetMinutes: 15,
    color: "#65747a",
  },
];

const officers = ["Maria Reyes", "Joel Santos", "Ana Dela Cruz", "Ramon Garcia", "Liza Mendoza", "Carlo Bautista"];
const channels = ["Walk-in", "Walk-in", "Walk-in", "Online", "Phone"] as const;
const priorities = ["Regular", "Regular", "Regular", "Senior", "PWD", "Pregnant"] as const;
const pad = (value: number) => String(value).padStart(3, "0");
const addMinutes = (value: string, minutes: number) =>
  new Date(new Date(value).getTime() + minutes * 60_000).toISOString();

export function createFrontlineDummyData(residents: Resident[]) {
  const tickets: FrontlineTicket[] = [];
  const requests: ServiceRequest[] = [];
  const activeStatuses = ["Waiting", "Waiting", "Waiting", "Called", "Serving"] as const;

  for (let index = 0; index < 240; index += 1) {
    const resident = residents[(index * 13 + 7) % residents.length];
    const service = FRONTLINE_SERVICES[index % FRONTLINE_SERVICES.length];
    const dayOffset = index < 72 ? 0 : 1 + (index % 22);
    const day = String(23 - Math.min(dayOffset, 22)).padStart(2, "0");
    const hour = 8 + (index % 8);
    const minute = (index * 7) % 60;
    const issuedAt = `2026-09-${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
    const isToday = index < 72;
    const status = isToday ? activeStatuses[index % activeStatuses.length] : "Completed";
    const ticketNumber = `${service.code}-${pad((index % 96) + 1)}`;
    const publicReference = `FS-2609-${String(index + 1).padStart(6, "0")}`;
    const ticket: FrontlineTicket = {
      id: `frontline-ticket-${String(index + 1).padStart(5, "0")}`,
      ticketNumber,
      publicReference,
      barangayId: resident.address.barangayId,
      residentId: resident.id,
      serviceId: service.id,
      channel: channels[index % channels.length],
      priority: priorities[index % priorities.length],
      status,
      counter: status === "Waiting" ? "" : `Counter ${(index % 5) + 1}`,
      officer: status === "Waiting" ? "" : officers[index % officers.length],
      issuedAt,
      calledAt: status === "Waiting" ? "" : addMinutes(issuedAt, 4 + (index % 5)),
      startedAt: status === "Serving" || status === "Completed" ? addMinutes(issuedAt, 7 + (index % 6)) : "",
      completedAt: status === "Completed" ? addMinutes(issuedAt, service.targetMinutes - 4 + (index % 13)) : "",
      notes: "",
    };
    tickets.push(ticket);
    requests.push({
      id: `frontline-request-${String(index + 1).padStart(5, "0")}`,
      publicReference,
      ticketId: ticket.id,
      barangayId: resident.address.barangayId,
      residentId: resident.id,
      serviceId: service.id,
      channel: ticket.channel,
      status: status === "Completed" ? "Completed" : status === "Serving" ? "In progress" : "Queued",
      assignedOffice: service.office,
      assignedOfficer: ticket.officer,
      submittedAt: issuedAt,
      targetAt: new Date(new Date(issuedAt).getTime() + service.targetMinutes * 60_000).toISOString(),
      updatedAt: issuedAt,
    });
  }

  const categories = ["Service complaint", "Staff conduct", "Delay", "Facility", "Suggestion", "Commendation"] as const;
  const messages = [
    "The queue moved slowly during the morning peak.",
    "Staff explained the document requirements clearly.",
    "Please add more seating near the public assistance desk.",
    "The tracking reference made the follow-up easier.",
    "The client was redirected twice before reaching the correct desk.",
    "Counter staff handled the request professionally.",
  ];
  const feedbacks: FrontlineFeedback[] = Array.from({ length: 120 }, (_, index) => {
    const request = requests[(index * 7 + 3) % requests.length];
    const category = categories[index % categories.length];
    const status = (["New", "Assigned", "Under review", "Resolved", "Resolved"] as const)[index % 5];
    return {
      id: `frontline-feedback-${String(index + 1).padStart(5, "0")}`,
      feedbackReference: `FB-2609-${String(index + 1).padStart(5, "0")}`,
      serviceReference: request.publicReference,
      barangayId: request.barangayId,
      residentId: request.residentId,
      category,
      rating: category === "Commendation" ? 5 : category === "Suggestion" ? 4 : 1 + (index % 3),
      message: messages[index % messages.length],
      status,
      assignedOffice: request.assignedOffice,
      assignedOfficer: status === "New" ? "" : officers[index % officers.length],
      submittedAt: addMinutes(request.submittedAt, 55 + (index % 180)),
      resolvedAt: status === "Resolved" ? addMinutes(request.submittedAt, 220 + (index % 420)) : "",
      resolution: status === "Resolved" ? "Reviewed with the assigned desk and action recorded." : "",
    };
  });

  return { tickets, requests, feedbacks };
}
