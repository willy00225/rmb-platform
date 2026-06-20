"use client";
import { useQuery } from "@tanstack/react-query";
import { Radio, Loader2 } from "lucide-react";

export function RadioWidget() {
  const { data: config, isLoading } = useQuery({
    queryKey: ["radio-config"],
    queryFn: () => fetch("/api/radio").then(res => res.json()),
    refetchInterval: 30000,
  });

  return (
    <div className="relative p-6 rounded-[var(--radius-card)] bg-white dark:bg-surface border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow group">
      <div className="absolute top-4 right-4 text-red-400 opacity-30 group-hover:opacity-100 transition-opacity">
        <Radio size={32} />
      </div>
      <p className="text-sm text-text-secondary font-medium">Radio RMB</p>
      {isLoading ? (
        <Loader2 className="animate-spin text-primary mt-2" size={20} />
      ) : config?.onAir ? (
        <>
          <p className="text-2xl font-bold text-text mt-3">EN DIRECT</p>
          <p className="text-xs text-text-secondary mt-2">{config.currentShow || "Émission en cours"}</p>
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-text mt-3">Hors antenne</p>
          <p className="text-xs text-text-secondary mt-2">Revenez bientôt</p>
        </>
      )}
    </div>
  );
}