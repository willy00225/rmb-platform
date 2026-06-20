"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminRadioPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["radio-config"],
    queryFn: () => fetch("/api/radio").then(res => res.json()),
  });

  const podcasts = config?.podcasts || [];
  const [streamUrl, setStreamUrl] = useState(config?.streamUrl || "");
  const [onAir, setOnAir] = useState(config?.onAir || false);
  const [currentShow, setCurrentShow] = useState(config?.currentShow || "");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastUrl, setPodcastUrl] = useState("");

  const updateMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/radio", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radio-config"] });
      toast.success("Configuration mise à jour.");
    },
  });

  const addPodcastMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/radio/podcasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radio-config"] });
      setPodcastTitle(""); setPodcastUrl("");
      toast.success("Podcast ajouté.");
    },
  });

  const deletePodcastMutation = useMutation({
    mutationFn: (id: string) => fetch("/api/radio/podcasts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radio-config"] });
      toast.success("Podcast supprimé.");
    },
  });

  if (isLoading) return <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Gestion Radio</h1>

      <div className="rounded-2xl bg-white dark:bg-surface border border-border p-6">
        <h2 className="text-xl font-semibold text-text mb-4">Direct</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary">URL du flux audio</label>
            <input type="text" value={streamUrl} onChange={e => setStreamUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border text-text" placeholder="https://..." />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Nom de l'émission</label>
            <input type="text" value={currentShow} onChange={e => setCurrentShow(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border text-text" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onAir} onChange={e => setOnAir(e.target.checked)} />
            <span className="text-text">En direct</span>
          </label>
          <Button onClick={() => updateMutation.mutate({ streamUrl, onAir, currentShow })} variant="primary"><Save size={18} /> Enregistrer</Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-surface border border-border p-6">
        <h2 className="text-xl font-semibold text-text mb-4">Ajouter un podcast</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Titre" value={podcastTitle} onChange={e => setPodcastTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border text-text" />
          <input type="text" placeholder="URL du fichier audio" value={podcastUrl} onChange={e => setPodcastUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border text-text" />
          <Button onClick={() => addPodcastMutation.mutate({ title: podcastTitle, url: podcastUrl })} variant="secondary"><Save size={18} /> Ajouter</Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-surface border border-border p-6">
        <h2 className="text-xl font-semibold text-text mb-4">Podcasts ({podcasts.length})</h2>
        {podcasts.length === 0 ? <p className="text-text-secondary italic">Aucun podcast.</p> : (
          <ul className="space-y-2">
            {podcasts.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <span className="text-text">{p.title}</span>
                <button onClick={() => deletePodcastMutation.mutate(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}