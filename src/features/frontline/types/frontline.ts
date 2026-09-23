export type FrontlineChannel = "Walk-in" | "Online" | "Phone";
export type FrontlinePriority = "Regular" | "Senior" | "PWD" | "Pregnant" | "Emergency";
export type QueueStatus = "Waiting" | "Called" | "Serving" | "Completed" | "No show";
export type RequestStatus = "Queued" | "In progress" | "For release" | "Completed" | "Cancelled";
export type FeedbackCategory =
  | "Service complaint"
  | "Staff conduct"
  | "Delay"
  | "Facility"
  | "Suggestion"
  | "Commendation";
export type FeedbackStatus = "New" | "Assigned" | "Under review" | "Resolved";

export type FrontlineService = {
  id: string;
  code: string;
  name: string;
  office: string;
  targetMinutes: number;
  color: string;
};

export type FrontlineTicket = {
  id: string;
  ticketNumber: string;
  publicReference: string;
  barangayId: string;
  residentId: string;
  serviceId: string;
  channel: FrontlineChannel;
  priority: FrontlinePriority;
  status: QueueStatus;
  counter: string;
  officer: string;
  issuedAt: string;
  calledAt: string;
  startedAt: string;
  completedAt: string;
  notes: string;
};

export type ServiceRequest = {
  id: string;
  publicReference: string;
  ticketId: string;
  barangayId: string;
  residentId: string;
  serviceId: string;
  channel: FrontlineChannel;
  status: RequestStatus;
  assignedOffice: string;
  assignedOfficer: string;
  submittedAt: string;
  targetAt: string;
  updatedAt: string;
};

export type NewTicketInput = {
  residentId: string;
  serviceId: string;
  channel: FrontlineChannel;
  priority: FrontlinePriority;
  notes: string;
};

export type FrontlineFeedback = {
  id: string;
  feedbackReference: string;
  serviceReference: string;
  barangayId: string;
  residentId: string;
  category: FeedbackCategory;
  rating: number;
  message: string;
  status: FeedbackStatus;
  assignedOffice: string;
  assignedOfficer: string;
  submittedAt: string;
  resolvedAt: string;
  resolution: string;
};

export type NewFeedbackInput = Pick<
  FrontlineFeedback,
  "serviceReference" | "residentId" | "category" | "rating" | "message"
>;
