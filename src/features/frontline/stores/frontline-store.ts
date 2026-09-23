"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createFrontlineDummyData, FRONTLINE_SERVICES } from "../data/frontline-data";
import type {
  FrontlineFeedback,
  FrontlineTicket,
  NewFeedbackInput,
  NewTicketInput,
  ServiceRequest,
} from "../types/frontline";

type FrontlineState = {
  tickets: FrontlineTicket[];
  requests: ServiceRequest[];
  feedbacks: FrontlineFeedback[];
  issueTicket: (input: NewTicketInput) => FrontlineTicket;
  callTicket: (id: string) => void;
  startServing: (id: string) => void;
  completeTicket: (id: string) => void;
  markNoShow: (id: string) => void;
  assignTicket: (id: string, officer: string, counter: string) => void;
  addFeedback: (input: NewFeedbackInput) => FrontlineFeedback;
  assignFeedback: (id: string) => void;
  resolveFeedback: (id: string) => void;
};

const residents = createResidentDummyData(1200);
const seed = createFrontlineDummyData(residents);

const nowIso = () => new Date().toISOString();

export const useFrontlineStore = create<FrontlineState>((set, get) => ({
  tickets: seed.tickets,
  requests: seed.requests,
  feedbacks: seed.feedbacks,
  issueTicket: (input) => {
    const resident = residents.find((item) => item.id === input.residentId) ?? residents[0];
    const service = FRONTLINE_SERVICES.find((item) => item.id === input.serviceId) ?? FRONTLINE_SERVICES[0];
    const sequence = get().tickets.length + 1;
    const todayServiceCount = get().tickets.filter(
      (item) => item.serviceId === service.id && item.issuedAt.slice(0, 10) === "2026-09-23",
    ).length;
    const issuedAt = nowIso();
    const ticket: FrontlineTicket = {
      id: `frontline-session-${sequence}`,
      ticketNumber: `${service.code}-${String(todayServiceCount + 1).padStart(3, "0")}`,
      publicReference: `FS-2609-${String(sequence).padStart(6, "0")}`,
      barangayId: resident.address.barangayId,
      residentId: resident.id,
      serviceId: service.id,
      channel: input.channel,
      priority: input.priority,
      status: "Waiting",
      counter: "",
      officer: "",
      issuedAt,
      calledAt: "",
      startedAt: "",
      completedAt: "",
      notes: input.notes,
    };
    const request: ServiceRequest = {
      id: `frontline-request-session-${sequence}`,
      publicReference: ticket.publicReference,
      ticketId: ticket.id,
      barangayId: ticket.barangayId,
      residentId: ticket.residentId,
      serviceId: ticket.serviceId,
      channel: ticket.channel,
      status: "Queued",
      assignedOffice: service.office,
      assignedOfficer: "",
      submittedAt: issuedAt,
      targetAt: new Date(new Date(issuedAt).getTime() + service.targetMinutes * 60_000).toISOString(),
      updatedAt: issuedAt,
    };
    set((state) => ({ tickets: [ticket, ...state.tickets], requests: [request, ...state.requests] }));
    return ticket;
  },
  callTicket: (id) => {
    const timestamp = nowIso();
    set((state) => ({
      tickets: state.tickets.map((item) =>
        item.id === id
          ? { ...item, status: "Called", counter: "Counter 1", officer: "Maria Reyes", calledAt: timestamp }
          : item,
      ),
      requests: state.requests.map((item) =>
        item.ticketId === id ? { ...item, assignedOfficer: "Maria Reyes", updatedAt: timestamp } : item,
      ),
    }));
  },
  startServing: (id) => {
    const timestamp = nowIso();
    set((state) => ({
      tickets: state.tickets.map((item) =>
        item.id === id ? { ...item, status: "Serving", startedAt: timestamp } : item,
      ),
      requests: state.requests.map((item) =>
        item.ticketId === id ? { ...item, status: "In progress", updatedAt: timestamp } : item,
      ),
    }));
  },
  completeTicket: (id) => {
    const timestamp = nowIso();
    set((state) => ({
      tickets: state.tickets.map((item) =>
        item.id === id ? { ...item, status: "Completed", completedAt: timestamp } : item,
      ),
      requests: state.requests.map((item) =>
        item.ticketId === id ? { ...item, status: "Completed", updatedAt: timestamp } : item,
      ),
    }));
  },
  markNoShow: (id) => {
    const timestamp = nowIso();
    set((state) => ({
      tickets: state.tickets.map((item) =>
        item.id === id ? { ...item, status: "No show", completedAt: timestamp } : item,
      ),
      requests: state.requests.map((item) =>
        item.ticketId === id ? { ...item, status: "Cancelled", updatedAt: timestamp } : item,
      ),
    }));
  },
  assignTicket: (id, officer, counter) => {
    const timestamp = nowIso();
    set((state) => ({
      tickets: state.tickets.map((item) => (item.id === id ? { ...item, officer, counter } : item)),
      requests: state.requests.map((item) =>
        item.ticketId === id ? { ...item, assignedOfficer: officer, updatedAt: timestamp } : item,
      ),
    }));
  },
  addFeedback: (input) => {
    const request = get().requests.find((item) => item.publicReference === input.serviceReference);
    const resident = residents.find((item) => item.id === input.residentId) ?? residents[0];
    const sequence = get().feedbacks.length + 1;
    const feedback: FrontlineFeedback = {
      id: `frontline-feedback-session-${sequence}`,
      feedbackReference: `FB-2609-${String(sequence).padStart(5, "0")}`,
      serviceReference: input.serviceReference,
      barangayId: request?.barangayId ?? resident.address.barangayId,
      residentId: input.residentId,
      category: input.category,
      rating: input.rating,
      message: input.message,
      status: "New",
      assignedOffice: request?.assignedOffice ?? "Public Assistance Desk",
      assignedOfficer: "",
      submittedAt: nowIso(),
      resolvedAt: "",
      resolution: "",
    };
    set((state) => ({ feedbacks: [feedback, ...state.feedbacks] }));
    return feedback;
  },
  assignFeedback: (id) =>
    set((state) => ({
      feedbacks: state.feedbacks.map((item) =>
        item.id === id ? { ...item, status: "Assigned", assignedOfficer: "Public Assistance Officer" } : item,
      ),
    })),
  resolveFeedback: (id) =>
    set((state) => ({
      feedbacks: state.feedbacks.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Resolved",
              assignedOfficer: item.assignedOfficer || "Public Assistance Officer",
              resolvedAt: nowIso(),
              resolution: "Reviewed with the assigned desk and action recorded.",
            }
          : item,
      ),
    })),
}));
