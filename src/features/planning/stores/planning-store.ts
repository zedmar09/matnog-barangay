"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createPlanningDummyData } from "../data/planning-data";
import type {
  BarangayDevelopmentPlan,
  BdcCouncil,
  BdcMember,
  DevelopmentPriority,
  MunicipalSubmission,
  NewBdcMemberInput,
  NewDevelopmentPriorityInput,
  NewPlanningMeetingInput,
  NewProjectProposalInput,
  PlanningMeeting,
  ProjectProposal,
} from "../types/planning";

type PlanningState = {
  councils: BdcCouncil[];
  members: BdcMember[];
  meetings: PlanningMeeting[];
  priorities: DevelopmentPriority[];
  plans: BarangayDevelopmentPlan[];
  proposals: ProjectProposal[];
  submissions: MunicipalSubmission[];
  appointMember: (input: NewBdcMemberInput) => BdcMember;
  scheduleMeeting: (input: NewPlanningMeetingInput) => PlanningMeeting;
  advanceMeeting: (id: string) => PlanningMeeting | undefined;
  addPriority: (input: NewDevelopmentPriorityInput) => DevelopmentPriority;
  advancePriority: (id: string) => DevelopmentPriority | undefined;
  advancePlan: (id: string) => BarangayDevelopmentPlan | undefined;
  addProposal: (input: NewProjectProposalInput) => ProjectProposal;
  advanceProposal: (id: string) => ProjectProposal | undefined;
  advanceSubmission: (id: string) => MunicipalSubmission | undefined;
  advanceReview: (id: string) => MunicipalSubmission | undefined;
};

const initialData = createPlanningDummyData(createResidentDummyData(1200));

export const usePlanningStore = create<PlanningState>((set, get) => ({
  ...initialData,
  appointMember: (input) => {
    const sequence = get().members.length + 1;
    const member: BdcMember = {
      ...input,
      id: `bdc-session-${sequence}`,
      attendanceRate: 0,
      status: "Active",
    };
    set((state) => ({
      members: [...state.members, member],
      councils: state.councils.map((council) =>
        council.barangayId === input.barangayId
          ? {
              ...council,
              status:
                state.members.filter((item) => item.barangayId === input.barangayId).length + 1 >= 12
                  ? "Complete"
                  : "Needs action",
              lastReviewedAt: new Date().toISOString().slice(0, 10),
            }
          : council,
      ),
    }));
    return member;
  },
  scheduleMeeting: (input) => {
    const sequence = get().meetings.length + 1;
    const invitedMemberIds = get()
      .members.filter((member) => member.barangayId === input.barangayId && member.status !== "Inactive")
      .map((member) => member.id);
    const meeting: PlanningMeeting = {
      ...input,
      id: `planning-meeting-session-${sequence}`,
      referenceNumber: `BDC-MTG-${input.barangayId.toUpperCase()}-${String(sequence).padStart(4, "0")}`,
      status: "Scheduled",
      agenda: [
        {
          id: `agenda-session-${sequence}-1`,
          title: "Opening and approval of the agenda",
          presenter: "BDC Chairperson",
          decision: "Awaiting meeting",
          outcome: "For discussion",
        },
      ],
      presentMemberIds: [],
      invitedMemberIds,
      minutesSummary: "Minutes will become available after attendance and agenda outcomes are recorded.",
      resolutionsPassed: 0,
      attachmentCount: 0,
      preparedBy: "",
      approvedBy: "",
    };
    set((state) => ({ meetings: [meeting, ...state.meetings] }));
    return meeting;
  },
  advanceMeeting: (id) => {
    const current = get().meetings.find((meeting) => meeting.id === id);
    if (!current || current.status === "Approved") return undefined;
    const nextStatus =
      current.status === "Scheduled"
        ? "Minutes draft"
        : current.status === "Minutes draft"
          ? "For approval"
          : "Approved";
    const updated: PlanningMeeting = {
      ...current,
      status: nextStatus,
      presentMemberIds:
        current.status === "Scheduled"
          ? current.invitedMemberIds.slice(0, Math.max(1, current.invitedMemberIds.length - 2))
          : current.presentMemberIds,
      minutesSummary:
        current.status === "Scheduled"
          ? "The council convened with quorum, reviewed the approved agenda, and assigned the Planning Committee to document the agreed next actions."
          : current.minutesSummary,
      preparedBy: current.status === "Scheduled" ? "Barangay Secretary" : current.preparedBy,
      approvedBy: nextStatus === "Approved" ? "BDC Chairperson" : current.approvedBy,
    };
    set((state) => ({ meetings: state.meetings.map((meeting) => (meeting.id === id ? updated : meeting)) }));
    return updated;
  },
  addPriority: (input) => {
    const sequence = get().priorities.length + 1;
    const score = input.severity * 30 + input.reach * 25 + input.urgency * 25 + input.feasibility * 20;
    const priority: DevelopmentPriority = {
      ...input,
      id: `development-priority-session-${sequence}`,
      referenceNumber: `BDP-PRI-${input.barangayId.toUpperCase()}-${String(sequence).padStart(4, "0")}`,
      score,
      rank: 1,
      status: "Identified",
    };
    set((state) => {
      const priorities = [priority, ...state.priorities];
      const rankedIds = priorities
        .filter((item) => item.barangayId === input.barangayId)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.id);
      return {
        priorities: priorities.map((item) =>
          item.barangayId === input.barangayId ? { ...item, rank: rankedIds.indexOf(item.id) + 1 } : item,
        ),
      };
    });
    return priority;
  },
  advancePriority: (id) => {
    const current = get().priorities.find((priority) => priority.id === id);
    if (!current || current.status === "Incorporated") return undefined;
    const nextStatus =
      current.status === "Identified" ? "Validated" : current.status === "Validated" ? "Endorsed" : "Incorporated";
    const updated = { ...current, status: nextStatus } satisfies DevelopmentPriority;
    set((state) => ({
      priorities: state.priorities.map((priority) => (priority.id === id ? updated : priority)),
      plans:
        nextStatus === "Endorsed" || nextStatus === "Incorporated"
          ? state.plans.map((plan) =>
              plan.barangayId === current.barangayId && !plan.priorityAreaIds.includes(id)
                ? { ...plan, priorityAreaIds: [...plan.priorityAreaIds, id], lastUpdatedAt: "2026-09-23" }
                : plan,
            )
          : state.plans,
    }));
    return updated;
  },
  advancePlan: (id) => {
    const current = get().plans.find((plan) => plan.id === id);
    if (!current || current.status === "Adopted") return undefined;
    const nextStatus =
      current.status === "Draft" ? "For validation" : current.status === "For validation" ? "Approved" : "Adopted";
    const updated: BarangayDevelopmentPlan = {
      ...current,
      status: nextStatus,
      version: current.status === "Draft" ? current.version + 1 : current.version,
      validatedBy: nextStatus === "For validation" ? "Municipal Planning and Development Office" : current.validatedBy,
      approvedBy: nextStatus === "Approved" || nextStatus === "Adopted" ? "Sangguniang Barangay" : current.approvedBy,
      adoptionResolution:
        nextStatus === "Adopted" ? `RES-${current.barangayId.toUpperCase()}-2026-NEW` : current.adoptionResolution,
      lastUpdatedAt: "2026-09-23",
    };
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === id ? updated : plan)),
      priorities:
        nextStatus === "Adopted"
          ? state.priorities.map((priority) =>
              priority.barangayId === current.barangayId && priority.status === "Endorsed"
                ? { ...priority, status: "Incorporated" }
                : priority,
            )
          : state.priorities,
    }));
    return updated;
  },
  addProposal: (input) => {
    const sequence = get().proposals.length + 1;
    const proposal: ProjectProposal = {
      ...input,
      id: `project-proposal-session-${sequence}`,
      referenceNumber: `BDP-PRJ-${input.barangayId.toUpperCase()}-${String(sequence).padStart(4, "0")}`,
      status: "Draft",
      technicalScore: 0,
      reviewerNotes: "Technical review begins after the proposal and supporting files are submitted.",
      attachmentCount: 0,
      createdAt: "2026-09-23",
      approvedBy: "",
    };
    set((state) => ({ proposals: [proposal, ...state.proposals] }));
    return proposal;
  },
  advanceProposal: (id) => {
    const current = get().proposals.find((proposal) => proposal.id === id);
    if (!current || current.status === "Approved") return undefined;
    const nextStatus =
      current.status === "Needs revision"
        ? "Draft"
        : current.status === "Draft"
          ? "For technical review"
          : current.status === "For technical review"
            ? "For funding"
            : "Approved";
    const updated: ProjectProposal = {
      ...current,
      status: nextStatus,
      technicalScore: nextStatus === "For technical review" ? 82 : current.technicalScore,
      reviewerNotes:
        current.status === "Needs revision"
          ? "Revision workspace reopened. Update the cost basis and supporting files before resubmission."
          : nextStatus === "For funding"
            ? "Technical review passed. Proposal is ready for funding confirmation."
            : current.reviewerNotes,
      approvedBy: nextStatus === "Approved" ? "Sangguniang Barangay" : current.approvedBy,
    };
    set((state) => ({
      proposals: state.proposals.map((proposal) => (proposal.id === id ? updated : proposal)),
    }));
    return updated;
  },
  advanceSubmission: (id) => {
    const current = get().submissions.find((submission) => submission.id === id);
    if (!current || current.status === "Received") return undefined;
    const nextStatus = current.status === "Draft" ? "Ready" : current.status === "Ready" ? "Submitted" : "Received";
    const received = nextStatus === "Received";
    const updated: MunicipalSubmission = {
      ...current,
      status: nextStatus,
      checklist:
        current.status === "Draft"
          ? current.checklist.map((item) => ({
              ...item,
              complete: true,
              documentCount: Math.max(1, item.documentCount),
            }))
          : current.checklist,
      attachmentCount: current.status === "Draft" ? Math.max(current.attachmentCount, 10) : current.attachmentCount,
      submittedAt: nextStatus === "Submitted" ? "2026-09-23" : current.submittedAt,
      submittedBy: nextStatus === "Submitted" ? "Barangay Development Council Secretariat" : current.submittedBy,
      receivedAt: received ? "2026-09-24" : current.receivedAt,
      reviewStatus: received ? "Under review" : current.reviewStatus,
      reviewScore: received ? 82 : current.reviewScore,
      feedback: received
        ? [
            ...current.feedback,
            {
              id: `feedback-${current.barangayId}-session-receipt`,
              date: "2026-09-24",
              author: "MPDO Records Officer",
              office: "Municipal Planning and Development Office",
              type: "Receipt",
              message: "Submission package received and assigned for technical review.",
            },
          ]
        : current.feedback,
    };
    set((state) => ({
      submissions: state.submissions.map((submission) => (submission.id === id ? updated : submission)),
    }));
    return updated;
  },
  advanceReview: (id) => {
    const current = get().submissions.find((submission) => submission.id === id);
    if (!current || current.reviewStatus === "Awaiting receipt" || current.reviewStatus === "Accepted")
      return undefined;
    const nextStatus =
      current.reviewStatus === "Under review"
        ? "For revision"
        : current.reviewStatus === "For revision"
          ? "Resubmitted"
          : current.reviewStatus === "Resubmitted"
            ? "Endorsed"
            : "Accepted";
    const feedbackType =
      nextStatus === "For revision" ? "Revision" : nextStatus === "Resubmitted" ? "Response" : "Decision";
    const message =
      nextStatus === "For revision"
        ? "Update the cost basis and attach the signed consultation summary before resubmission."
        : nextStatus === "Resubmitted"
          ? "The barangay submitted the requested corrections and replacement supporting files."
          : nextStatus === "Endorsed"
            ? "The corrected package was endorsed for investment programming and funding consideration."
            : "The municipal planning office accepted the package for programming and archive.";
    const updated: MunicipalSubmission = {
      ...current,
      reviewStatus: nextStatus,
      revisionDueDate: nextStatus === "For revision" ? "2026-10-15" : "",
      feedback: [
        ...current.feedback,
        {
          id: `feedback-${current.barangayId}-session-${current.feedback.length + 1}`,
          date: "2026-09-24",
          author:
            nextStatus === "Resubmitted" ? "Barangay Development Council Secretariat" : "Municipal Planning Officer",
          office: nextStatus === "Resubmitted" ? `Barangay ${current.barangayId}` : "MPDO",
          type: feedbackType,
          message,
        },
      ],
    };
    set((state) => ({
      submissions: state.submissions.map((submission) => (submission.id === id ? updated : submission)),
    }));
    return updated;
  },
}));
