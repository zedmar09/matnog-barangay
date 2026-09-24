"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { MATNOG_BARANGAYS } from "@/data/barangays";

type BarangayScopeContextValue = {
  scopeHydrated: boolean;
  /** Backward compat: "all" when nothing is selected, otherwise first code */
  selectedBarangay: string;
  selectedBarangayName: string;
  selectedBarangays: string[];
  isAllSelected: boolean;
  toggleBarangay: (code: string) => void;
  selectAll: () => void;
  isInScope: (barangayCode: string) => boolean;
};

const BarangayScopeContext = createContext<BarangayScopeContextValue | null>(null);

export function BarangayScopeProvider({ children }: { children: ReactNode }) {
  const [scopeHydrated, setScopeHydrated] = useState(false);
  const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("matnog-barangay-scope");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSelectedBarangays(parsed);
        } else if (typeof parsed === "string" && parsed !== "all") {
          setSelectedBarangays([parsed]);
        }
      }
    } catch {
      // ignore
    }
    setScopeHydrated(true);
  }, []);

  useEffect(() => {
    if (scopeHydrated) {
      window.localStorage.setItem("matnog-barangay-scope", JSON.stringify(selectedBarangays));
    }
  }, [scopeHydrated, selectedBarangays]);

  const value = useMemo(() => {
    const isAllSelected = selectedBarangays.length === 0;
    const selectedBarangay = isAllSelected ? "all" : selectedBarangays[0];
    const scopeSet = new Set(selectedBarangays);
    const isInScope = (code: string) => isAllSelected || scopeSet.has(code);

    let selectedBarangayName: string;
    if (isAllSelected) {
      selectedBarangayName = "All Barangays";
    } else if (selectedBarangays.length === 1) {
      const record = MATNOG_BARANGAYS.find((b) => b.code === selectedBarangays[0]);
      selectedBarangayName = record ? `Brgy. ${record.name}` : "All Barangays";
    } else {
      selectedBarangayName = `${selectedBarangays.length} Barangays`;
    }

    return {
      scopeHydrated,
      selectedBarangay,
      selectedBarangayName,
      selectedBarangays,
      isAllSelected,
      toggleBarangay: (code: string) => {
        setSelectedBarangays((prev) => {
          if (prev.includes(code)) {
            return prev.filter((c) => c !== code);
          }
          return [...prev, code];
        });
      },
      selectAll: () => setSelectedBarangays([]),
      isInScope,
    };
  }, [scopeHydrated, selectedBarangays]);

  return <BarangayScopeContext.Provider value={value}>{children}</BarangayScopeContext.Provider>;
}

export function useBarangayScope() {
  const value = useContext(BarangayScopeContext);
  if (!value) throw new Error("useBarangayScope must be used inside BarangayScopeProvider");
  return value;
}
