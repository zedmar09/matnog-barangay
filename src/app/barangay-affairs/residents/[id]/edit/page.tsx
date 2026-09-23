"use client";
import { use } from "react";

import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { ResidentFormView } from "@/features/resident-registry/views/resident-form-view";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const resident = useResidentRegistryStore((s) => s.residents.find((r) => r.id === id));
  return resident ? <ResidentFormView resident={resident} /> : <ResidentFormView />;
}
