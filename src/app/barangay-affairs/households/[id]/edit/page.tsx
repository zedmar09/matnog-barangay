"use client";

import { use } from "react";

import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import { HouseholdRegisterView } from "@/features/household-registry/views/household-register-view";

export default function HouseholdEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const household = useHouseholdRegistryStore((state) => state.households.find((item) => item.id === id));
  return <HouseholdRegisterView household={household} />;
}
