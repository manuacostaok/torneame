"use client";

import { useState, useTransition } from "react";
import { followOrganizer, unfollowOrganizer } from "@/app/actions/follows";
import { useToast } from "@/app/components/Toast";

export function FollowButton({
  organizerId,
  initiallyFollowing,
  isLoggedIn,
}: {
  organizerId: string;
  initiallyFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleClick() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    const next = !following;
    setFollowing(next); // optimista — se revierte si falla

    startTransition(async () => {
      try {
        if (next) {
          await followOrganizer(organizerId);
        } else {
          await unfollowOrganizer(organizerId);
        }
      } catch (err) {
        setFollowing(!next);
        toast(err instanceof Error ? err.message : "No se pudo actualizar", "error");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-md px-4 py-2 text-sm disabled:opacity-60 ${
        following ? "border border-strong" : "bg-primary text-white"
      }`}
    >
      {following ? "Siguiendo" : "Seguir"}
    </button>
  );
}
