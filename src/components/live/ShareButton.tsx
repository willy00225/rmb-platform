"use client";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

export function ShareButton() {
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    } catch (err) {
      toast.error("Impossible de copier le lien.");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-1.5 rounded-full hover:bg-white/10 transition"
      title="Copier le lien"
      aria-label="Copier le lien"
    >
      <Share2 size={18} className="text-text-secondary" />
    </button>
  );
}