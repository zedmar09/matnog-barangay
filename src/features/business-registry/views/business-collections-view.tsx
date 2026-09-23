"use client";

import { useMemo, useState } from "react";

import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Printer,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessPayment, BusinessPaymentMethod } from "../types/business";
import businessStyles from "./business.module.css";

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;

const paymentMethods: BusinessPaymentMethod[] = ["Cash", "GCash", "Bank transfer", "Check"];

export function BusinessCollectionsView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const payments = useBusinessRegistryStore((state) => state.payments);
  const collectPayment = useBusinessRegistryStore((state) => state.collectPayment);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);
  const scoped = businesses.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const queue = scoped.filter(
    (item) => item.status !== "Closed" && item.assessedFee > 0 && item.amountPaid < item.assessedFee,
  );
  const filtered = queue.filter((item) =>
    `${item.businessName} ${item.businessNumber}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const initial = filtered[0];
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [amount, setAmount] = useState(initial ? String(Math.max(0, initial.assessedFee - initial.amountPaid)) : "");
  const [paymentMethod, setPaymentMethod] = useState<BusinessPaymentMethod>("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notice, setNotice] = useState("");
  const [latestReceipt, setLatestReceipt] = useState<BusinessPayment | null>(null);
  const selected = businesses.find((item) => item.id === selectedId) ?? initial;
  const balance = selected ? Math.max(0, selected.assessedFee - selected.amountPaid) : 0;
  const scopedIds = useMemo(() => new Set(scoped.map((item) => item.id)), [scoped]);
  const scopedPayments = payments.filter((item) => scopedIds.has(item.businessId));
  const today = new Date().toISOString().slice(0, 10);
  const todayPayments = scopedPayments.filter((item) => item.paymentDate === today);
  const outstanding = queue.reduce((sum, item) => sum + (item.assessedFee - item.amountPaid), 0);
  const selectedPayments = selected ? payments.filter((item) => item.businessId === selected.id) : [];

  const chooseBusiness = (id: string, due: number) => {
    setSelectedId(id);
    setAmount(String(due));
    setPaymentMethod("Cash");
    setReferenceNumber("");
    setLatestReceipt(null);
    setNotice("");
  };

  const postPayment = () => {
    if (!selected) return;
    const numericAmount = Number(amount);
    const result = collectPayment(selected.id, numericAmount, paymentMethod, referenceNumber);
    if (!result) {
      setNotice("Enter an amount greater than zero and within the remaining balance.");
      return;
    }
    setLatestReceipt(result);
    const remaining = Math.max(0, balance - numericAmount);
    setAmount(remaining ? String(remaining) : "");
    setNotice(
      remaining
        ? `${result.receiptNumber} was posted. ${money(remaining)} remains due.`
        : `${result.receiptNumber} was posted. The business is ready for clearance issuance.`,
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>Business Fee Collections</h1>
          <p>Receive assessed business fees and issue controlled official receipts for {selectedBarangayName}.</p>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ReceiptText size={18} />
          </span>
          <div>
            <strong>{queue.length}</strong>
            <span>Accounts with balance</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleDollarSign size={18} />
          </span>
          <div>
            <strong>{money(outstanding)}</strong>
            <span>Outstanding amount</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Banknote size={18} />
          </span>
          <div>
            <strong>{money(todayPayments.reduce((sum, item) => sum + item.amount, 0))}</strong>
            <span>Collected today</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <WalletCards size={18} />
          </span>
          <div>
            <strong>{todayPayments.length}</strong>
            <span>Receipts today</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={latestReceipt ? businessStyles.successNotice : businessStyles.warningNotice}>
          {latestReceipt ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
          <span>{notice}</span>
        </div>
      ) : null}

      <div className={businessStyles.collectionWorkspace}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search collection queue"
              />
            </div>
          </div>
          <div className={styles.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> assessed accounts
            </span>
            <span>{money(outstanding)} due</span>
          </div>
          <div className={businessStyles.collectionList}>
            {filtered.slice(0, 80).map((item) => {
              const due = item.assessedFee - item.amountPaid;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={selected?.id === item.id ? businessStyles.selectedRecord : ""}
                  onClick={() => chooseBusiness(item.id, due)}
                >
                  <span className={businessStyles.businessIcon}>
                    <ReceiptText size={15} />
                  </span>
                  <div>
                    <strong>{item.businessName}</strong>
                    <small>
                      {item.businessNumber} · {barangayName(item.barangayId)}
                    </small>
                  </div>
                  <span className={businessStyles.paymentProgress}>
                    <b>{money(due)} due</b>
                    <small>{item.amountPaid ? `${money(item.amountPaid)} paid` : "No payment"}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <CreditCard size={18} />
            <div>
              <strong>Receive payment</strong>
              <small>Validate the assessment before posting an official receipt</small>
            </div>
          </div>
          {selected ? (
            <>
              <div className={businessStyles.collectionAccount}>
                <div>
                  <span>Business account</span>
                  <strong>{selected.businessName}</strong>
                  <small>
                    {selected.businessNumber} · {barangayName(selected.barangayId)}
                  </small>
                </div>
                <div>
                  <span>Registered owner</span>
                  <strong>{residentMap.get(selected.ownerResidentId) ?? "Resident record"}</strong>
                  <small>{selected.businessType}</small>
                </div>
              </div>

              <div className={businessStyles.balanceStrip}>
                <div>
                  <span>Assessed</span>
                  <strong>{money(selected.assessedFee)}</strong>
                </div>
                <div>
                  <span>Previously paid</span>
                  <strong>{money(selected.amountPaid)}</strong>
                </div>
                <div className={businessStyles.balanceDue}>
                  <span>Balance due</span>
                  <strong>{money(balance)}</strong>
                </div>
              </div>

              <div className={businessStyles.paymentForm}>
                <label>
                  <span>Amount to collect</span>
                  <div className={businessStyles.moneyInput}>
                    <b>₱</b>
                    <input
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <small>Maximum allowed: {money(balance)}</small>
                </label>
                <label>
                  <span>Payment method</span>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as BusinessPaymentMethod)}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                  <small>Choose the tender received by the cashier.</small>
                </label>
                <label className={businessStyles.fullField}>
                  <span>Reference number</span>
                  <input
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    placeholder="Optional for cash; required by office policy for digital payments"
                  />
                </label>
              </div>

              <div className={businessStyles.collectionFooter}>
                <div>
                  <ReceiptText size={16} />
                  <span>
                    <strong>Official receipt assigned after posting</strong>
                    <small>Payments cannot exceed the remaining assessed balance.</small>
                  </span>
                </div>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={balance <= 0 || Number(amount) <= 0 || Number(amount) > balance}
                  onClick={postPayment}
                >
                  <Banknote size={14} /> Post payment
                </button>
              </div>

              {latestReceipt ? (
                <div className={businessStyles.receiptPanel}>
                  <header>
                    <div>
                      <span>Republic of the Philippines</span>
                      <strong>BARANGAY {barangayName(selected.barangayId).toUpperCase()}</strong>
                      <small>Municipality of Matnog, Province of Sorsogon</small>
                    </div>
                    <b>OFFICIAL RECEIPT</b>
                  </header>
                  <dl>
                    <div>
                      <dt>Receipt number</dt>
                      <dd>{latestReceipt.receiptNumber}</dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>{latestReceipt.paymentDate}</dd>
                    </div>
                    <div>
                      <dt>Received from</dt>
                      <dd>{selected.businessName}</dd>
                    </div>
                    <div>
                      <dt>Payment method</dt>
                      <dd>{latestReceipt.paymentMethod}</dd>
                    </div>
                    <div>
                      <dt>Amount received</dt>
                      <dd>{money(latestReceipt.amount)}</dd>
                    </div>
                    <div>
                      <dt>Collector</dt>
                      <dd>{latestReceipt.collector}</dd>
                    </div>
                  </dl>
                  <footer>
                    <span>Balance after payment: {money(balance)}</span>
                    <button className={styles.secondaryButton} type="button" onClick={() => window.print()}>
                      <Printer size={14} /> Print receipt
                    </button>
                  </footer>
                </div>
              ) : selectedPayments.length ? (
                <div className={businessStyles.paymentHistory}>
                  <div>
                    <strong>Payment history</strong>
                    <small>{selectedPayments.length} recorded transaction(s)</small>
                  </div>
                  {selectedPayments.slice(0, 3).map((payment) => (
                    <article key={payment.id}>
                      <span>
                        <b>{payment.receiptNumber}</b>
                        <small>
                          {payment.paymentDate} · {payment.paymentMethod}
                        </small>
                      </span>
                      <strong>{money(payment.amount)}</strong>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className={businessStyles.emptyCollection}>
              <CheckCircle2 size={28} />
              <strong>No outstanding assessments</strong>
              <span>The current barangay scope has no business fees awaiting collection.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
