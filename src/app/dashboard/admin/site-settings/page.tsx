"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SiteSettingsPage() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ["site-config"],
    queryFn: () => fetch("/api/admin/site-config").then(res => res.json()),
  });
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      fetch("/api/admin/site-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
      toast.success("Configuration mise à jour.");
    },
  });

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => mutation.mutate(form);

  if (isLoading) return <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8 animate-fadeInUp max-w-xl">
      <h1 className="text-3xl font-display font-bold text-text">Paramètres du site</h1>
      <div className="rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 p-6 space-y-4">
        {[
          { key: "contact_address", label: "Adresse" },
          { key: "contact_email", label: "Email" },
          { key: "contact_phone", label: "Téléphone" },
          { key: "site_logo", label: "URL du logo" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-sm text-text-secondary">{label}</label>
            <input
              type="text"
              value={form[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text"
            />
          </div>
        ))}
        <Button onClick={handleSave} variant="primary" className="w-full">
          <Save size={16} className="mr-2" /> Enregistrer
        </Button>
      </div>
    </div>
  );
}