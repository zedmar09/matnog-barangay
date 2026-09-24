"use client";

import { use } from "react";

import { BusinessRegistrationWizard } from "@/features/business-registry/views/business-registration-view";

export default function BusinessEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BusinessRegistrationWizard businessId={id} />;
}
