export type BdcMemberStatus = "Active" | "Term ending" | "Inactive";

export type BdcMember = {
  id: string;
  barangayId: string;
  residentId: string;
  role: string;
  sector: string;
  committee: string;
  termStart: string;
  termEnd: string;
  appointmentReference: string;
  attendanceRate: number;
  status: BdcMemberStatus;
};

export type BdcCouncil = {
  barangayId: string;
  resolutionNumber: string;
  constitutedDate: string;
  planningCycle: string;
  status: "Complete" | "Needs action";
  lastReviewedAt: string;
};

export type NewBdcMemberInput = Omit<BdcMember, "id" | "attendanceRate" | "status">;

export type PlanningMeetingStatus = "Scheduled" | "Minutes draft" | "For approval" | "Approved";

export type PlanningAgendaItem = {
  id: string;
  title: string;
  presenter: string;
  decision: string;
  outcome: "For discussion" | "Noted" | "Approved" | "Deferred";
};

export type PlanningMeeting = {
  id: string;
  referenceNumber: string;
  barangayId: string;
  title: string;
  meetingType: "Regular" | "Special" | "Sector consultation";
  meetingDate: string;
  startTime: string;
  venue: string;
  status: PlanningMeetingStatus;
  agenda: PlanningAgendaItem[];
  presentMemberIds: string[];
  invitedMemberIds: string[];
  minutesSummary: string;
  resolutionsPassed: number;
  attachmentCount: number;
  preparedBy: string;
  approvedBy: string;
};

export type NewPlanningMeetingInput = Pick<
  PlanningMeeting,
  "barangayId" | "title" | "meetingType" | "meetingDate" | "startTime" | "venue"
>;

export type DevelopmentSector =
  | "Social development"
  | "Economic development"
  | "Infrastructure"
  | "Environment"
  | "Governance"
  | "Peace and order";

export type PriorityAreaStatus = "Identified" | "Validated" | "Endorsed" | "Incorporated";

export type DevelopmentPriority = {
  id: string;
  referenceNumber: string;
  barangayId: string;
  title: string;
  sector: DevelopmentSector;
  problemStatement: string;
  evidence: string;
  affectedPopulation: number;
  severity: number;
  reach: number;
  urgency: number;
  feasibility: number;
  score: number;
  rank: number;
  responsibleCommittee: string;
  targetYear: number;
  sourceMeetingId: string;
  status: PriorityAreaStatus;
};

export type NewDevelopmentPriorityInput = Pick<
  DevelopmentPriority,
  | "barangayId"
  | "title"
  | "sector"
  | "problemStatement"
  | "evidence"
  | "affectedPopulation"
  | "severity"
  | "reach"
  | "urgency"
  | "feasibility"
  | "responsibleCommittee"
  | "targetYear"
  | "sourceMeetingId"
>;

export type BdpStatus = "Draft" | "For validation" | "Approved" | "Adopted";

export type BarangayDevelopmentPlan = {
  id: string;
  referenceNumber: string;
  barangayId: string;
  planningCycle: string;
  version: number;
  status: BdpStatus;
  vision: string;
  developmentGoal: string;
  sectorObjectives: Array<{ sector: DevelopmentSector; objective: string }>;
  consultationMeetingIds: string[];
  priorityAreaIds: string[];
  preparedBy: string;
  validatedBy: string;
  approvedBy: string;
  adoptionResolution: string;
  lastUpdatedAt: string;
  attachmentCount: number;
};

export type ProjectProposalStatus = "Draft" | "For technical review" | "Needs revision" | "For funding" | "Approved";

export type ProjectProposal = {
  id: string;
  referenceNumber: string;
  barangayId: string;
  priorityId: string;
  title: string;
  description: string;
  objective: string;
  expectedOutputs: string[];
  estimatedBudget: number;
  fundingSource: "Barangay Development Fund" | "Municipal support" | "External grant" | "Shared funding";
  implementationStart: string;
  implementationEnd: string;
  proponent: string;
  status: ProjectProposalStatus;
  technicalScore: number;
  reviewerNotes: string;
  attachmentCount: number;
  createdAt: string;
  approvedBy: string;
};

export type NewProjectProposalInput = Pick<
  ProjectProposal,
  | "barangayId"
  | "priorityId"
  | "title"
  | "description"
  | "objective"
  | "expectedOutputs"
  | "estimatedBudget"
  | "fundingSource"
  | "implementationStart"
  | "implementationEnd"
  | "proponent"
>;

export type MunicipalSubmissionStatus = "Draft" | "Ready" | "Submitted" | "Received";

export type MunicipalReviewStatus =
  | "Awaiting receipt"
  | "Under review"
  | "For revision"
  | "Resubmitted"
  | "Endorsed"
  | "Accepted";

export type SubmissionChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
  documentCount: number;
};

export type MunicipalFeedbackItem = {
  id: string;
  date: string;
  author: string;
  office: string;
  type: "Receipt" | "Comment" | "Revision" | "Response" | "Decision";
  message: string;
};

export type MunicipalSubmission = {
  id: string;
  referenceNumber: string;
  barangayId: string;
  planId: string;
  projectIds: string[];
  checklist: SubmissionChecklistItem[];
  attachmentCount: number;
  status: MunicipalSubmissionStatus;
  reviewStatus: MunicipalReviewStatus;
  reviewScore: number;
  submittedAt: string;
  receivedAt: string;
  submittedBy: string;
  receivingOffice: string;
  revisionDueDate: string;
  feedback: MunicipalFeedbackItem[];
};
