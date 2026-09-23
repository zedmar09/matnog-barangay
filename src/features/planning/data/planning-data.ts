import { MATNOG_BARANGAYS } from "@/data/barangays";
import type { Resident } from "@/features/resident-registry/types/resident";

import type {
  BarangayDevelopmentPlan,
  BdcCouncil,
  BdcMember,
  BdpStatus,
  DevelopmentPriority,
  DevelopmentSector,
  MunicipalFeedbackItem,
  MunicipalReviewStatus,
  MunicipalSubmission,
  PlanningMeeting,
  PlanningMeetingStatus,
  PriorityAreaStatus,
  ProjectProposal,
  ProjectProposalStatus,
} from "../types/planning";

export const BDC_ROLES = [
  "BDC Chairperson",
  "BDC Vice Chairperson",
  "Sangguniang Barangay Member",
  "SK Chairperson",
  "Barangay Secretary",
  "Sectoral Representative",
  "NGO Representative",
  "People's Organization Representative",
] as const;

export const BDC_SECTORS = [
  "Barangay Government",
  "Youth",
  "Women",
  "Senior Citizens",
  "PWD",
  "Farmers and Fisherfolk",
  "Business",
  "Civil Society",
] as const;

const committees = [
  "Executive Committee",
  "Infrastructure",
  "Social Development",
  "Economic Development",
  "Environment",
  "Peace and Order",
];

export const DEVELOPMENT_SECTORS: DevelopmentSector[] = [
  "Social development",
  "Economic development",
  "Infrastructure",
  "Environment",
  "Governance",
  "Peace and order",
];

const priorityTemplates: Array<
  Pick<DevelopmentPriority, "title" | "sector" | "problemStatement" | "evidence" | "responsibleCommittee">
> = [
  {
    title: "Reliable potable water access",
    sector: "Infrastructure",
    problemStatement: "Several sitios experience intermittent water supply during dry months.",
    evidence: "Household inventory and community consultation reports",
    responsibleCommittee: "Infrastructure",
  },
  {
    title: "Livelihood support for coastal families",
    sector: "Economic development",
    problemStatement: "Fishing households need supplemental income during closed and rough-sea periods.",
    evidence: "Fisherfolk registry and sector consultation minutes",
    responsibleCommittee: "Economic Development",
  },
  {
    title: "Nutrition and maternal health outreach",
    sector: "Social development",
    problemStatement: "At-risk children and expectant mothers require regular community health follow-up.",
    evidence: "Sectoral registry and barangay health monitoring summaries",
    responsibleCommittee: "Social Development",
  },
  {
    title: "Flood and coastal hazard mitigation",
    sector: "Environment",
    problemStatement: "Low-lying households remain exposed to seasonal flooding and storm surge.",
    evidence: "Hazard inventory and community risk assessment",
    responsibleCommittee: "Environment",
  },
  {
    title: "Community safety lighting",
    sector: "Peace and order",
    problemStatement: "Unlit road sections limit safe movement and night patrol visibility.",
    evidence: "Peace and order reports and resident requests",
    responsibleCommittee: "Peace and Order",
  },
];

const roleForSeat = (seat: number) => {
  if (seat === 0) return "BDC Chairperson";
  if (seat === 1) return "BDC Vice Chairperson";
  if (seat <= 4) return "Sangguniang Barangay Member";
  if (seat === 5) return "SK Chairperson";
  if (seat === 6) return "Barangay Secretary";
  if (seat <= 8) return "Sectoral Representative";
  if (seat === 9) return "NGO Representative";
  return "People's Organization Representative";
};

export function createPlanningDummyData(residents: Resident[]) {
  const councils: BdcCouncil[] = MATNOG_BARANGAYS.map((barangay, index) => ({
    barangayId: barangay.code,
    resolutionNumber: `BDC-${barangay.code.toUpperCase()}-2026-${String(index + 1).padStart(3, "0")}`,
    constitutedDate: `2026-0${(index % 8) + 1}-${String((index % 20) + 1).padStart(2, "0")}`,
    planningCycle: "2026–2028",
    status: index % 5 === 0 ? "Needs action" : "Complete",
    lastReviewedAt: `2026-09-${String((index % 21) + 1).padStart(2, "0")}`,
  }));

  const members: BdcMember[] = councils.flatMap((council, barangayIndex) => {
    const barangayResidents = residents.filter(
      (resident) => resident.address.barangayId === council.barangayId && resident.residentStatus === "Active",
    );
    const seatCount = council.status === "Complete" ? 12 : 10;
    return Array.from({ length: seatCount }, (_, seat) => {
      const resident =
        barangayResidents[(seat * 7 + barangayIndex) % Math.max(barangayResidents.length, 1)] ?? residents[seat];
      const role = roleForSeat(seat);
      return {
        id: `bdc-${council.barangayId}-${String(seat + 1).padStart(2, "0")}`,
        barangayId: council.barangayId,
        residentId: resident.id,
        role,
        sector: BDC_SECTORS[(seat + barangayIndex) % BDC_SECTORS.length],
        committee: committees[(seat + barangayIndex) % committees.length],
        termStart: "2025-01-01",
        termEnd: seat % 7 === 0 ? "2026-12-31" : "2028-12-31",
        appointmentReference: `EO-${council.barangayId.toUpperCase()}-2025-${String(seat + 1).padStart(2, "0")}`,
        attendanceRate: 68 + ((seat * 7 + barangayIndex) % 32),
        status: seat % 7 === 0 ? "Term ending" : "Active",
      } satisfies BdcMember;
    });
  });

  const meetings: PlanningMeeting[] = councils.flatMap((council, barangayIndex) => {
    const councilMembers = members.filter((member) => member.barangayId === council.barangayId);
    const statuses: PlanningMeetingStatus[] = [
      "Approved",
      barangayIndex % 2 === 0 ? "For approval" : "Minutes draft",
      "Scheduled",
    ];
    return statuses.map((status, meetingIndex) => {
      const sequence = barangayIndex * 3 + meetingIndex + 1;
      const scheduled = status === "Scheduled";
      const presentCount = scheduled ? 0 : Math.max(6, councilMembers.length - ((barangayIndex + meetingIndex) % 4));
      const agendaTitles = [
        "Review of priority development concerns",
        "Proposed projects and indicative costs",
        "Community consultation and sector updates",
      ];
      return {
        id: `planning-meeting-${String(sequence).padStart(4, "0")}`,
        referenceNumber: `BDC-MTG-${council.barangayId.toUpperCase()}-${String(meetingIndex + 1).padStart(2, "0")}`,
        barangayId: council.barangayId,
        title:
          meetingIndex === 0
            ? "First Quarter BDC Regular Meeting"
            : meetingIndex === 1
              ? "Development Priorities Workshop"
              : "Project Validation and Budget Consultation",
        meetingType: meetingIndex === 1 ? "Sector consultation" : meetingIndex === 2 ? "Special" : "Regular",
        meetingDate:
          meetingIndex === 0
            ? `2026-03-${String((barangayIndex % 20) + 3).padStart(2, "0")}`
            : meetingIndex === 1
              ? `2026-08-${String((barangayIndex % 20) + 3).padStart(2, "0")}`
              : `2026-10-${String((barangayIndex % 20) + 3).padStart(2, "0")}`,
        startTime: meetingIndex === 1 ? "13:30" : "09:00",
        venue: meetingIndex === 1 ? "Barangay Multi-Purpose Hall" : "Barangay Hall Session Room",
        status,
        agenda: agendaTitles.map((title, agendaIndex) => ({
          id: `agenda-${sequence}-${agendaIndex + 1}`,
          title,
          presenter:
            agendaIndex === 0 ? "BDC Chairperson" : agendaIndex === 1 ? "Planning Committee" : "Sector Representatives",
          decision: scheduled
            ? "Awaiting meeting"
            : agendaIndex === 0
              ? "Concern areas validated for inclusion in the BDP."
              : agendaIndex === 1
                ? "Priority proposals endorsed for technical costing."
                : "Sector comments recorded for plan revision.",
          outcome: scheduled ? "For discussion" : agendaIndex === 2 && meetingIndex === 1 ? "Noted" : "Approved",
        })),
        presentMemberIds: councilMembers.slice(0, presentCount).map((member) => member.id),
        invitedMemberIds: councilMembers.map((member) => member.id),
        minutesSummary: scheduled
          ? "Minutes will become available after attendance and agenda outcomes are recorded."
          : "The council reviewed barangay development concerns, confirmed priority interventions, and assigned committees to prepare the supporting project information.",
        resolutionsPassed: scheduled ? 0 : meetingIndex === 0 ? 2 : 1,
        attachmentCount: scheduled ? 1 : 3 + ((barangayIndex + meetingIndex) % 4),
        preparedBy: scheduled ? "" : "Barangay Secretary",
        approvedBy: status === "Approved" ? "BDC Chairperson" : "",
      } satisfies PlanningMeeting;
    });
  });

  const priorities: DevelopmentPriority[] = councils.flatMap((council, barangayIndex) => {
    const approvedMeeting = meetings.find(
      (meeting) => meeting.barangayId === council.barangayId && meeting.status === "Approved",
    );
    const statuses: PriorityAreaStatus[] = ["Incorporated", "Endorsed", "Validated", "Identified", "Validated"];
    const scored = priorityTemplates.map((template, priorityIndex) => {
      const severity = 3 + ((barangayIndex + priorityIndex) % 3);
      const reach = 2 + ((barangayIndex * 2 + priorityIndex) % 4);
      const urgency = 3 + ((barangayIndex + priorityIndex * 2) % 3);
      const feasibility = 2 + ((barangayIndex + priorityIndex * 3) % 4);
      return {
        template,
        priorityIndex,
        severity,
        reach,
        urgency,
        feasibility,
        score: severity * 30 + reach * 25 + urgency * 25 + feasibility * 20,
      };
    });
    const rankByIndex = new Map(
      [...scored].sort((a, b) => b.score - a.score).map((item, rank) => [item.priorityIndex, rank + 1]),
    );
    return scored.map(({ template, priorityIndex, severity, reach, urgency, feasibility, score }) => ({
      id: `development-priority-${council.barangayId}-${priorityIndex + 1}`,
      referenceNumber: `BDP-PRI-${council.barangayId.toUpperCase()}-${String(priorityIndex + 1).padStart(2, "0")}`,
      barangayId: council.barangayId,
      ...template,
      affectedPopulation: 95 + ((barangayIndex * 83 + priorityIndex * 147) % 1150),
      severity,
      reach,
      urgency,
      feasibility,
      score,
      rank: rankByIndex.get(priorityIndex) ?? priorityIndex + 1,
      targetYear: 2026 + (priorityIndex % 3),
      sourceMeetingId: approvedMeeting?.id ?? "",
      status: statuses[(priorityIndex + barangayIndex) % statuses.length],
    }));
  });

  const plans: BarangayDevelopmentPlan[] = councils.map((council, barangayIndex) => {
    const barangayPriorities = priorities
      .filter((priority) => priority.barangayId === council.barangayId)
      .sort((a, b) => a.rank - b.rank);
    const barangayMeetings = meetings.filter(
      (meeting) => meeting.barangayId === council.barangayId && meeting.status === "Approved",
    );
    const statuses: BdpStatus[] = ["Adopted", "Approved", "For validation", "Draft"];
    const status = statuses[barangayIndex % statuses.length];
    return {
      id: `bdp-${council.barangayId}`,
      referenceNumber: `BDP-${council.barangayId.toUpperCase()}-2026-2028`,
      barangayId: council.barangayId,
      planningCycle: council.planningCycle,
      version: 1 + (barangayIndex % 3),
      status,
      vision: `A safe, inclusive, resilient, and economically active ${MATNOG_BARANGAYS[barangayIndex]?.name ?? council.barangayId} where every household can access essential services and participate in local development.`,
      developmentGoal:
        "Improve household well-being through focused social services, resilient infrastructure, local livelihoods, accountable governance, and community-led risk reduction.",
      sectorObjectives: DEVELOPMENT_SECTORS.map((sector, sectorIndex) => ({
        sector,
        objective: [
          "Expand timely access to community health, education, and protection services.",
          "Create stable livelihood opportunities using local skills and natural resources.",
          "Deliver safe, accessible, and climate-resilient community facilities.",
          "Protect coastal and upland resources while reducing disaster exposure.",
          "Strengthen participatory planning, transparent records, and service accountability.",
          "Maintain safe public spaces through prevention, mediation, and coordinated response.",
        ][sectorIndex],
      })),
      consultationMeetingIds: barangayMeetings.map((meeting) => meeting.id),
      priorityAreaIds: barangayPriorities
        .filter((priority) => ["Endorsed", "Incorporated"].includes(priority.status))
        .map((priority) => priority.id),
      preparedBy: "Barangay Development Council Secretariat",
      validatedBy: status === "Draft" ? "" : "Municipal Planning and Development Office",
      approvedBy: ["Approved", "Adopted"].includes(status) ? "Sangguniang Barangay" : "",
      adoptionResolution: status === "Adopted" ? `RES-${council.barangayId.toUpperCase()}-2026-18` : "",
      lastUpdatedAt: `2026-09-${String((barangayIndex % 21) + 1).padStart(2, "0")}`,
      attachmentCount: 5 + (barangayIndex % 7),
    };
  });

  const projectTitles = [
    "Community Water System Rehabilitation",
    "Coastal Livelihood Equipment and Skills Program",
    "Barangay Nutrition and Maternal Care Outreach",
    "Flood Drainage and Coastal Protection Improvement",
    "Solar Community Safety Lighting Project",
  ];
  const outputSets = [
    ["Rehabilitated water distribution lines", "Functional communal water points", "Water quality test record"],
    ["Livelihood starter kits distributed", "Skills sessions completed", "Beneficiary monitoring register"],
    ["Monthly nutrition sessions delivered", "At-risk households visited", "Maternal referral desk activated"],
    ["Priority drainage sections cleared", "Protective structures installed", "Community maintenance team organized"],
    ["Solar streetlights installed", "Dark road sections illuminated", "Maintenance inventory completed"],
  ];
  const proposals: ProjectProposal[] = councils.flatMap((council, barangayIndex) => {
    const barangayPriorities = priorities
      .filter((priority) => priority.barangayId === council.barangayId)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 4);
    return barangayPriorities.map((priority, projectIndex) => {
      const templateIndex = Math.max(
        0,
        priorityTemplates.findIndex((template) => template.title === priority.title),
      );
      const statuses: ProjectProposalStatus[] = [
        "Approved",
        "For funding",
        barangayIndex % 3 === 0 ? "Needs revision" : "For technical review",
        "Draft",
      ];
      const status = statuses[projectIndex];
      const budget = 180000 + ((barangayIndex * 87500 + projectIndex * 145000) % 1320000);
      return {
        id: `project-proposal-${council.barangayId}-${projectIndex + 1}`,
        referenceNumber: `BDP-PRJ-${council.barangayId.toUpperCase()}-${String(projectIndex + 1).padStart(2, "0")}`,
        barangayId: council.barangayId,
        priorityId: priority.id,
        title: projectTitles[templateIndex],
        description: `A targeted barangay intervention responding to the validated priority on ${priority.title.toLowerCase()}.`,
        objective: `Reduce the documented service gap and deliver measurable benefits to ${priority.affectedPopulation.toLocaleString("en-PH")} affected residents.`,
        expectedOutputs: outputSets[templateIndex],
        estimatedBudget: budget,
        fundingSource:
          projectIndex === 0
            ? "Barangay Development Fund"
            : projectIndex === 1
              ? "Shared funding"
              : projectIndex === 2
                ? "Municipal support"
                : "External grant",
        implementationStart: `2027-0${projectIndex + 1}-01`,
        implementationEnd: `2027-0${projectIndex + 4}-28`,
        proponent: `${priority.responsibleCommittee} Committee`,
        status,
        technicalScore: status === "Draft" ? 0 : 72 + ((barangayIndex * 3 + projectIndex * 7) % 27),
        reviewerNotes:
          status === "Needs revision"
            ? "Clarify the cost basis and attach the site validation report before resubmission."
            : status === "Draft"
              ? "Technical review begins after the proposal and supporting files are submitted."
              : "Scope, costs, safeguards, and expected outputs were reviewed against the endorsed priority.",
        attachmentCount: 2 + ((barangayIndex + projectIndex) % 6),
        createdAt: `2026-09-${String((barangayIndex % 21) + 1).padStart(2, "0")}`,
        approvedBy: status === "Approved" ? "Sangguniang Barangay" : "",
      } satisfies ProjectProposal;
    });
  });

  const checklistLabels = [
    "Adopted Barangay Development Plan",
    "BDC resolution and approved minutes",
    "Approved project proposal package",
    "Priority ranking and scoring matrix",
    "Barangay adoption resolution",
    "Cost estimates and implementation schedule",
  ];
  const submissions: MunicipalSubmission[] = plans.map((plan, barangayIndex) => {
    const adopted = plan.status === "Adopted";
    const approvedProjects = proposals.filter(
      (proposal) => proposal.barangayId === plan.barangayId && proposal.status === "Approved",
    );
    const adoptedSequence = Math.floor(barangayIndex / 4) % 5;
    const status = !adopted ? "Draft" : adoptedSequence === 4 ? "Submitted" : "Received";
    const reviewStatuses: MunicipalReviewStatus[] = [
      "Accepted",
      "Endorsed",
      "For revision",
      "Under review",
      "Awaiting receipt",
    ];
    const reviewStatus = adopted ? reviewStatuses[adoptedSequence] : "Awaiting receipt";
    const submittedAt = status === "Draft" ? "" : `2026-09-${String((barangayIndex % 18) + 2).padStart(2, "0")}`;
    const receivedAt = status === "Received" ? `2026-09-${String((barangayIndex % 18) + 3).padStart(2, "0")}` : "";
    const feedback: MunicipalFeedbackItem[] = [];
    if (status === "Received") {
      feedback.push({
        id: `feedback-${plan.barangayId}-receipt`,
        date: receivedAt,
        author: "MPDO Records Officer",
        office: "Municipal Planning and Development Office",
        type: "Receipt",
        message: "Submission package received and assigned for technical review.",
      });
    }
    if (["Under review", "For revision", "Endorsed", "Accepted"].includes(reviewStatus)) {
      feedback.push({
        id: `feedback-${plan.barangayId}-comment`,
        date: `2026-09-${String((barangayIndex % 18) + 5).padStart(2, "0")}`,
        author: "Municipal Planning Review Team",
        office: "MPDO Technical Review Unit",
        type: "Comment",
        message: "Plan consistency, project costing, sector evidence, and implementation schedules were reviewed.",
      });
    }
    if (reviewStatus === "For revision") {
      feedback.push({
        id: `feedback-${plan.barangayId}-revision`,
        date: `2026-09-${String((barangayIndex % 18) + 7).padStart(2, "0")}`,
        author: "Municipal Planning Officer",
        office: "MPDO",
        type: "Revision",
        message: "Update the project cost assumptions and attach the signed sector consultation summary.",
      });
    }
    if (["Endorsed", "Accepted"].includes(reviewStatus)) {
      feedback.push({
        id: `feedback-${plan.barangayId}-decision`,
        date: `2026-09-${String((barangayIndex % 18) + 8).padStart(2, "0")}`,
        author: "Municipal Planning and Development Coordinator",
        office: "MPDO",
        type: "Decision",
        message:
          reviewStatus === "Accepted"
            ? "The development plan package was accepted for municipal programming and archive."
            : "The package was endorsed for investment programming and funding consideration.",
      });
    }
    return {
      id: `municipal-submission-${plan.barangayId}`,
      referenceNumber: `MPDO-SUB-${plan.barangayId.toUpperCase()}-2026`,
      barangayId: plan.barangayId,
      planId: plan.id,
      projectIds: approvedProjects.map((proposal) => proposal.id),
      checklist: checklistLabels.map((label, checklistIndex) => ({
        id: `check-${plan.barangayId}-${checklistIndex + 1}`,
        label,
        complete: adopted || (checklistIndex < 3 && plan.status === "Approved"),
        documentCount: adopted ? 1 + ((barangayIndex + checklistIndex) % 3) : checklistIndex < 3 ? 1 : 0,
      })),
      attachmentCount: adopted ? 10 + (barangayIndex % 8) : 3 + (barangayIndex % 4),
      status,
      reviewStatus,
      reviewScore: reviewStatus === "Awaiting receipt" ? 0 : 78 + ((barangayIndex * 3) % 21),
      submittedAt,
      receivedAt,
      submittedBy: status === "Draft" ? "" : "Barangay Development Council Secretariat",
      receivingOffice: "Municipal Planning and Development Office",
      revisionDueDate: reviewStatus === "For revision" ? "2026-10-15" : "",
      feedback,
    } satisfies MunicipalSubmission;
  });

  return { councils, members, meetings, priorities, plans, proposals, submissions };
}
