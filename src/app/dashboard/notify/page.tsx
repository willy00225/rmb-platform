"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminNotifyPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState("all");

  const handleSend = async () => {
    const res = await fetch("/api/admin/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, segment }),
    });
    if (res.ok) {
      toast.success("Notification envoyée");
      setTitle("");
      setMessage("");
    } else {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Notifications</h1>
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Envoyer une campagne</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white"
          >
            <option value="all">Tous les abonnés</option>
            <option value="AMBASSADOR">Ambassadeurs</option>
          </select>
          <Button onClick={handleSend} variant="primary">
            <Send size={16} /> Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}