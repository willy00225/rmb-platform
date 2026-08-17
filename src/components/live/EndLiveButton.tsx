"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import toast from "react-hot-toast";

export function EndLiveButton({ liveId }: { liveId: string }) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  const handleEndLive = async () => {
    if (!confirm("Voulez-vous vraiment terminer ce live ?")) return;

    setIsEnding(true);
    try {
      const res = await fetch(`/api/live/rooms/${liveId}/end`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur lors de la fin du live");
      toast.success("Live terminé !");
      router.push("/dashboard/live");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de terminer le live.");
      setIsEnding(false);
    }
  };

  return (
    <button
      onClick={handleEndLive}
      disabled={isEnding}
      className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50"
      title="Terminer le live"
      aria-label="Terminer le live"
    >
      <Power size={18} />
    </button>
  );
}