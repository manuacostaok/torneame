"use client";

import { useTransition } from "react";
import { buyProduct } from "@/app/actions/products";
import { useToast } from "@/app/components/Toast";

export function BuyProductButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleClick() {
    startTransition(async () => {
      try {
        const { checkoutUrl } = await buyProduct(productId);
        if (checkoutUrl) window.location.href = checkoutUrl;
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo procesar la compra", "error");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="w-full rounded-md bg-primary px-3 py-2 text-sm text-white disabled:opacity-60"
    >
      {isPending ? "Redirigiendo..." : "Comprar"}
    </button>
  );
}
