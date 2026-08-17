"use client";

import { useState } from "react";
import { subscribeToPush } from "@/app/actions/pushSubscriptions";
import { useToast } from "./Toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushNotificationOptIn() {
  const [status, setStatus] = useState<"idle" | "asking" | "on" | "denied">("idle");
  const toast = useToast();

  async function handleEnable() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast("Tu navegador no soporta notificaciones push", "error");
      return;
    }

    setStatus("asking");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });

    await subscribeToPush(subscription.toJSON() as never);
    setStatus("on");
    toast("Notificaciones activadas", "success");
  }

  if (status === "on") return <p className="text-xs text-secondary">🔔 Notificaciones activadas</p>;
  if (status === "denied") {
    return (
      <p className="text-xs text-secondary">
        Bloqueaste las notificaciones — activalas desde la config del navegador si cambiás de idea.
      </p>
    );
  }

  return (
    <button
      onClick={handleEnable}
      disabled={status === "asking"}
      className="rounded-md border border-strong px-3 py-1.5 text-xs disabled:opacity-60"
    >
      🔔 Activar notificaciones
    </button>
  );
}
