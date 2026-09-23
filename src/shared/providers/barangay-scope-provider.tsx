"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";

type BarangayScopeContextValue = {
  scopeHydrated: boolean;
  selectedBarangay: string;
  selectedBarangayName: string;
  setSelectedBarangay: (value: string) => void;
};

const BarangayScopeContext = createContext<BarangayScopeContextValue | null>(null);

export function BarangayScopeProvider({ children }: { children: ReactNode }) {
  const [scopeHydrated, setScopeHydrated] = useState(false);
  const selectedBarangay = useResidentRegistryStore((state) => state.selectedBarangay);
  const setSelectedBarangay = useResidentRegistryStore((state) => state.setBarangayScope);

  useEffect(() => {
    const savedScope = window.localStorage.getItem("matnog-barangay-scope");
    if (savedScope && (savedScope === "all" || MATNOG_BARANGAYS.some((barangay) => barangay.code === savedScope))) {
      setSelectedBarangay(savedScope);
    }
    setScopeHydrated(true);
  }, [setSelectedBarangay]);

  useEffect(() => {
    if (scopeHydrated) window.localStorage.setItem("matnog-barangay-scope", selectedBarangay);
  }, [scopeHydrated, selectedBarangay]);
  const value = useMemo(() => {
    const record = MATNOG_BARANGAYS.find((barangay) => barangay.code === selectedBarangay);
    return {
      scopeHydrated,
      selectedBarangay,
      selectedBarangayName: selectedBarangay === "all" || !record ? "All Barangays" : `Brgy. ${record.name}`,
      setSelectedBarangay,
    };
  }, [scopeHydrated, selectedBarangay, setSelectedBarangay]);

  return <BarangayScopeContext.Provider value={value}>{children}</BarangayScopeContext.Provider>;
}

export function useBarangayScope() {
  const value = useContext(BarangayScopeContext);
  if (!value) throw new Error("useBarangayScope must be used inside BarangayScopeProvider");
  return value;
}
