"use client";

import { useState, useTransition } from "react";
import { adminSetOrganizerPlan } from "@/app/actions/admin";
import { useToast } from "@/app/components/Toast";

export function PlanToggleButton({
  organizerId,
  currentPlan,
}: {
  organizerId: string;
  currentPlan: "FREE" | "PRO";
}) {
  const [plan, setPlan] = useState(currentPlan);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleClick() {
    const nextPlan = plan === "PRO" ? "FREE" : "PRO";
    startTransition(async () => {
      try {
        await adminSetOrganizerPlan(organizerId, nextPlan);
        setPlan(nextPlan);
        toast(`Ahora es ${nextPlan}`, "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo cambiar el plan", "error");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-md border border-strong px-3 py-1.5 text-xs disabled:opacity-60"
    >
      {plan === "PRO" ? "Sacar PRO" : "Dar PRO"}
    </button>
  );
}
