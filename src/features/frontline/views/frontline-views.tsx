"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileClock,
  Megaphone,
  Plus,
  Search,
  TicketCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { FRONTLINE_SERVICES } from "../data/frontline-data";
import { useFrontlineStore } from "../stores/frontline-store";
import type { FrontlinePriority, FrontlineTicket, QueueStatus, RequestStatus } from "../types/frontline";
import frontlineStyles from "./frontline.module.css";

const TODAY = "2026-09-23";
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const serviceFor = (id: string) => FRONTLINE_SERVICES.find((item) => item.id === id) ?? FRONTLINE_SERVICES[0];
const time = (value: string) =>
  value ? new Date(value).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }) : "—";
const dateTime = (value: string) =>
  value
    ? new Date(value).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

function QueueBadge({ status }: { status: QueueStatus | RequestStatus }) {
  const badgeClass =
    status === "Completed"
      ? styles.active
      : status === "Serving" || status === "In progress" || status === "For release"
        ? styles.info
        : status === "No show" || status === "Cancelled"
          ? styles.danger
          : styles.warning;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

function ResidentName({ id }: { id: string }) {
  const resident = useResidentRegistryStore((state) => state.residents.find((item) => item.id === id));
  return <>{resident ? formatResidentName(resident) : "Resident record"}</>;
}

export function FrontlineDashboardView() {
  const tickets = useFrontlineStore((state) => state.tickets);
  const requests = useFrontlineStore((state) => state.requests);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const scopedTickets = tickets.filter(
    (item) =>
      (selectedBarangay === "all" || item.barangayId === selectedBarangay) && item.issuedAt.slice(0, 10) === TODAY,
  );
  const scopedRequests = requests.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const active = scopedTickets.filter((item) => ["Waiting", "Called", "Serving"].includes(item.status));
  const completed = scopedTickets.filter((item) => item.status === "Completed");
  const avgWait = active.length
    ? Math.round(active.reduce((sum, _item, index) => sum + 6 + (index % 18), 0) / active.length)
    : 0;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A8 Frontline Services</p>
          <h1>Frontline Operations</h1>
          <p>{selectedBarangayName} queue, service requests, and counter turnaround for today.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/frontline/tickets/new">
          <Plus size={15} /> Issue ticket
        </Link>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{active.length}</strong>
            <span>People in active queue</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{avgWait} min</strong>
            <span>Average waiting time</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{completed.length}</strong>
            <span>Completed today</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileClock size={18} />
          </span>
          <div>
            <strong>
              {scopedRequests.filter((item) => item.status !== "Completed" && item.status !== "Cancelled").length}
            </strong>
            <span>Open service requests</span>
          </div>
        </div>
      </div>

      <div className={frontlineStyles.dashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Counter floor</p>
              <h2>Now serving</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/frontline/queue">
              Open live queue
            </Link>
          </div>
          <div className={frontlineStyles.servingBoard}>
            {active
              .filter((item) => item.status === "Serving" || item.status === "Called")
              .slice(0, 8)
              .map((item) => {
                const service = serviceFor(item.serviceId);
                return (
                  <article
                    key={item.id}
                    className={frontlineStyles.servingCard}
                    style={{ "--service-color": service.color } as React.CSSProperties}
                  >
                    <div>
                      <span>{item.status === "Called" ? "Please proceed" : "Now serving"}</span>
                      <strong>{item.ticketNumber}</strong>
                    </div>
                    <p>{service.name}</p>
                    <footer>
                      <b>{item.counter}</b>
                      <small>{item.officer}</small>
                    </footer>
                  </article>
                );
              })}
          </div>
        </section>

        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Queue health</p>
              <h2>Today at a glance</h2>
            </div>
          </div>
          <div className={frontlineStyles.queueHealth}>
            <div>
              <span>
                <CircleDot size={15} /> Waiting
              </span>
              <strong>{scopedTickets.filter((item) => item.status === "Waiting").length}</strong>
            </div>
            <div>
              <span>
                <Megaphone size={15} /> Called
              </span>
              <strong>{scopedTickets.filter((item) => item.status === "Called").length}</strong>
            </div>
            <div>
              <span>
                <UserRound size={15} /> Serving
              </span>
              <strong>{scopedTickets.filter((item) => item.status === "Serving").length}</strong>
            </div>
            <div>
              <span>
                <CheckCircle2 size={15} /> Completed
              </span>
              <strong>{completed.length}</strong>
            </div>
          </div>
        </aside>
      </div>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Service catalog</p>
            <h2>Routing and service targets</h2>
          </div>
        </div>
        <div className={frontlineStyles.serviceCatalog}>
          {FRONTLINE_SERVICES.map((service) => {
            const serviceTickets = scopedTickets.filter((item) => item.serviceId === service.id);
            return (
              <article key={service.id} style={{ "--service-color": service.color } as React.CSSProperties}>
                <span>{service.code}</span>
                <div>
                  <strong>{service.name}</strong>
                  <small>{service.office}</small>
                </div>
                <footer>
                  <b>{serviceTickets.length} today</b>
                  <small>{service.targetMinutes} min target</small>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Request tracking</p>
            <h2>Recent public references</h2>
          </div>
          <Link className={styles.secondaryButton} href="/barangay-affairs/frontline/requests">
            View requests
          </Link>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Public reference</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Service</th>
                <th>Channel</th>
                <th>Office</th>
                <th>Updated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scopedRequests.slice(0, 12).map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.publicReference}</td>
                  <td>
                    <ResidentName id={item.residentId} />
                  </td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{serviceFor(item.serviceId).name}</td>
                  <td>{item.channel}</td>
                  <td>{item.assignedOffice}</td>
                  <td>{dateTime(item.updatedAt)}</td>
                  <td>
                    <QueueBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function FrontlineQueueView() {
  const tickets = useFrontlineStore((state) => state.tickets);
  const callTicket = useFrontlineStore((state) => state.callTicket);
  const startServing = useFrontlineStore((state) => state.startServing);
  const completeTicket = useFrontlineStore((state) => state.completeTicket);
  const markNoShow = useFrontlineStore((state) => state.markNoShow);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const rows = tickets.filter(
    (item) =>
      item.issuedAt.slice(0, 10) === TODAY &&
      (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
      (!serviceId || item.serviceId === serviceId) &&
      (!status || item.status === status),
  );
  const act = (ticket: FrontlineTicket, action: "call" | "serve" | "complete" | "no-show") => {
    if (action === "call") callTicket(ticket.id);
    if (action === "serve") startServing(ticket.id);
    if (action === "complete") completeTicket(ticket.id);
    if (action === "no-show") markNoShow(ticket.id);
    setNotice(
      `${ticket.ticketNumber} updated to ${action === "call" ? "Called" : action === "serve" ? "Serving" : action === "complete" ? "Completed" : "No show"}.`,
    );
  };
  return (
    <div className={styles.page}>
      {notice && (
        <div className={frontlineStyles.successNotice}>
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A8 Counter Operations</p>
          <h1>Live Queue</h1>
          <p>{selectedBarangayName} tickets for September 23, 2026.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/frontline/tickets/new">
          <Plus size={15} /> Issue ticket
        </Link>
      </header>
      <div className={frontlineStyles.queueStrip}>
        {(["Waiting", "Called", "Serving", "Completed"] as QueueStatus[]).map((item) => (
          <div key={item}>
            <span>{item}</span>
            <strong>{rows.filter((ticket) => ticket.status === item).length}</strong>
          </div>
        ))}
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <select
            className={styles.compactSelect}
            aria-label="Service type"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            <option value="">All services</option>
            {FRONTLINE_SERVICES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Queue status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {["Waiting", "Called", "Serving", "Completed", "No show"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} tickets</strong>
          <span>Priority clients remain visibly marked through the service flow</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1220 }}>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Issued</th>
                <th>Resident</th>
                <th>Service</th>
                <th>Priority</th>
                <th>Channel</th>
                <th>Counter</th>
                <th>Officer</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <strong className={frontlineStyles.ticketNumber}>{ticket.ticketNumber}</strong>
                    <small className={frontlineStyles.tableSub}>{ticket.publicReference}</small>
                  </td>
                  <td>{time(ticket.issuedAt)}</td>
                  <td>
                    <ResidentName id={ticket.residentId} />
                  </td>
                  <td>{serviceFor(ticket.serviceId).name}</td>
                  <td>
                    {ticket.priority === "Regular" ? (
                      ticket.priority
                    ) : (
                      <span className={`${styles.badge} ${styles.warning}`}>{ticket.priority}</span>
                    )}
                  </td>
                  <td>{ticket.channel}</td>
                  <td>{ticket.counter || "—"}</td>
                  <td>{ticket.officer || "Unassigned"}</td>
                  <td>
                    <QueueBadge status={ticket.status} />
                  </td>
                  <td>
                    <div className={frontlineStyles.actionRow}>
                      {ticket.status === "Waiting" && (
                        <button type="button" onClick={() => act(ticket, "call")}>
                          <BellRing size={13} /> Call
                        </button>
                      )}
                      {ticket.status === "Called" && (
                        <button type="button" onClick={() => act(ticket, "serve")}>
                          <ArrowRight size={13} /> Start
                        </button>
                      )}
                      {ticket.status === "Serving" && (
                        <button type="button" onClick={() => act(ticket, "complete")}>
                          <CheckCircle2 size={13} /> Complete
                        </button>
                      )}
                      {(ticket.status === "Waiting" || ticket.status === "Called") && (
                        <button
                          type="button"
                          className={frontlineStyles.quietAction}
                          onClick={() => act(ticket, "no-show")}
                        >
                          No show
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function IssueFrontlineTicketView() {
  const residents = useResidentRegistryStore((state) => state.residents);
  const issueTicket = useFrontlineStore((state) => state.issueTicket);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [residentId, setResidentId] = useState("");
  const [serviceId, setServiceId] = useState(FRONTLINE_SERVICES[0].id);
  const [priority, setPriority] = useState<FrontlinePriority>("Regular");
  const [channel, setChannel] = useState<"Walk-in" | "Online" | "Phone">("Walk-in");
  const [notes, setNotes] = useState("");
  const [issued, setIssued] = useState<FrontlineTicket | null>(null);
  const candidates = useMemo(
    () =>
      residents
        .filter(
          (item) =>
            (selectedBarangay === "all" || item.address.barangayId === selectedBarangay) &&
            item.residentStatus === "Active" &&
            (!search.trim() || `${formatResidentName(item)} ${item.lrn}`.toLowerCase().includes(search.toLowerCase())),
        )
        .slice(0, 80),
    [residents, search, selectedBarangay],
  );
  const selected = residents.find((item) => item.id === residentId);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!residentId) return;
    setIssued(issueTicket({ residentId, serviceId, channel, priority, notes }));
  };
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A8 Queue Intake</p>
          <h1>Issue Service Ticket</h1>
          <p>Select a resident, route the service, and generate one public tracking reference.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/frontline/queue">
          Open live queue
        </Link>
      </header>
      {issued && (
        <div className={frontlineStyles.issuedTicket}>
          <div>
            <span>Ticket issued</span>
            <strong>{issued.ticketNumber}</strong>
            <p>{issued.publicReference}</p>
          </div>
          <div>
            <b>{serviceFor(issued.serviceId).name}</b>
            <small>
              {selectedBarangayName} · {issued.priority} priority
            </small>
          </div>
          <Link href="/barangay-affairs/frontline/queue">
            View in live queue <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <div className={frontlineStyles.intakeGrid}>
        <section className={styles.card}>
          <div className={frontlineStyles.panelHeading}>
            <Search size={17} />
            <div>
              <strong>Find resident</strong>
              <small>Search the municipal registry</small>
            </div>
          </div>
          <label className={styles.searchBox} style={{ margin: 12 }}>
            <Search size={15} />
            <input
              aria-label="Search resident"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or Local Resident Number"
            />
          </label>
          <div className={frontlineStyles.residentList}>
            {candidates.map((resident) => (
              <button
                type="button"
                key={resident.id}
                className={residentId === resident.id ? frontlineStyles.selectedResident : ""}
                onClick={() => setResidentId(resident.id)}
              >
                <span>
                  {resident.firstName[0]}
                  {resident.lastName[0]}
                </span>
                <div>
                  <strong>{formatResidentName(resident)}</strong>
                  <small>
                    {resident.lrn} · Brgy. {barangayName(resident.address.barangayId)}
                  </small>
                </div>
                {residentId === resident.id && <CheckCircle2 size={16} />}
              </button>
            ))}
          </div>
        </section>
        <form className={`${styles.card} ${frontlineStyles.ticketForm}`} onSubmit={submit}>
          <div className={frontlineStyles.panelHeading}>
            <TicketCheck size={17} />
            <div>
              <strong>Service routing</strong>
              <small>Set the correct desk and client priority</small>
            </div>
          </div>
          {selected ? (
            <div className={frontlineStyles.selectedSummary}>
              <div>
                <small>RESIDENT</small>
                <strong>{formatResidentName(selected)}</strong>
                <span>{selected.lrn}</span>
              </div>
              <div>
                <small>BARANGAY</small>
                <strong>{barangayName(selected.address.barangayId)}</strong>
                <span>{selected.address.purok}</span>
              </div>
            </div>
          ) : (
            <div className={frontlineStyles.selectionPrompt}>
              Select a resident from the registry to issue a ticket.
            </div>
          )}
          <div className={frontlineStyles.formBody}>
            <div className={frontlineStyles.serviceChoices}>
              {FRONTLINE_SERVICES.map((service) => (
                <button
                  type="button"
                  key={service.id}
                  className={serviceId === service.id ? frontlineStyles.selectedService : ""}
                  onClick={() => setServiceId(service.id)}
                  style={{ "--service-color": service.color } as React.CSSProperties}
                >
                  <span>{service.code}</span>
                  <div>
                    <strong>{service.name}</strong>
                    <small>
                      {service.office} · {service.targetMinutes} min
                    </small>
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.formGrid} style={{ marginTop: 16 }}>
              <label className={styles.field}>
                <span>Priority</span>
                <select value={priority} onChange={(event) => setPriority(event.target.value as FrontlinePriority)}>
                  {["Regular", "Senior", "PWD", "Pregnant", "Emergency"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Channel</span>
                <select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as "Walk-in" | "Online" | "Phone")}
                >
                  {["Walk-in", "Online", "Phone"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className={`${styles.field} ${frontlineStyles.notesField}`}>
                <span>Intake note</span>
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional service note"
                />
              </label>
            </div>
            <button className={styles.primaryButton} style={{ marginTop: 16 }} type="submit" disabled={!residentId}>
              <TicketCheck size={15} /> Issue ticket and reference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FrontlineRequestsView() {
  const requests = useFrontlineStore((state) => state.requests);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [serviceId, setServiceId] = useState("");
  const rows = useMemo(
    () =>
      requests.filter((item) => {
        const resident = residents.find((entry) => entry.id === item.residentId);
        const residentName = resident ? formatResidentName(resident) : "";
        return (
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!status || item.status === status) &&
          (!serviceId || item.serviceId === serviceId) &&
          (!search.trim() || `${item.publicReference} ${residentName}`.toLowerCase().includes(search.toLowerCase()))
        );
      }),
    [requests, residents, search, selectedBarangay, serviceId, status],
  );
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A8 Public Reference Tracking</p>
          <h1>Service Requests</h1>
          <p>{selectedBarangayName} requests from every intake channel.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/frontline/tickets/new">
          <Plus size={15} /> Issue ticket
        </Link>
      </header>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search service requests"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference or resident"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Service type"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            <option value="">All services</option>
            {FRONTLINE_SERVICES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Request status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {["Queued", "In progress", "For release", "Completed", "Cancelled"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} service requests</strong>
          <span>Public references can be shared without exposing the resident record</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1260 }}>
            <thead>
              <tr>
                <th>Public reference</th>
                <th>Ticket</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Service</th>
                <th>Channel</th>
                <th>Assigned office</th>
                <th>Officer</th>
                <th>Submitted</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.publicReference}</td>
                  <td>
                    {useFrontlineStore.getState().tickets.find((ticket) => ticket.id === item.ticketId)?.ticketNumber ??
                      "—"}
                  </td>
                  <td>
                    <ResidentName id={item.residentId} />
                  </td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{serviceFor(item.serviceId).name}</td>
                  <td>{item.channel}</td>
                  <td>{item.assignedOffice}</td>
                  <td>{item.assignedOfficer || "Unassigned"}</td>
                  <td>{dateTime(item.submittedAt)}</td>
                  <td>{time(item.targetAt)}</td>
                  <td>
                    <QueueBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
