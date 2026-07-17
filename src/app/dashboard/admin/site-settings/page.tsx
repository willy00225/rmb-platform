"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Save,
  MapPin,
  Mail,
  Phone,
  Image as ImageIcon,
  Globe,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SiteSettingsPage() {
  const queryClient = useQueryClient();
  const { data: config, isLoading, isError } = useQuery<Record<string, string>>({
    queryKey: ["site-config"],
    queryFn: () => fetch("/api/admin/site-config").then((res) => res.json()),
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
    onError: () => toast.error("Erreur lors de la mise à jour."),
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Validation basique
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      toast.error("L'adresse email n'est pas valide.");
      return;
    }
    mutation.mutate(form);
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-secondary animate-pulse">Chargement des paramètres...</p>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-20 text-red-500">
        Erreur de chargement. Veuillez réessayer.
      </div>
    );

  const fields = [
    { key: "contact_address", label: "Adresse", icon: MapPin, placeholder: "Ex: Abidjan, Cocody" },
    { key: "contact_email", label: "Email de contact", icon: Mail, placeholder: "contact@rmb.ci", type: "email" },
    { key: "contact_phone", label: "Téléphone", icon: Phone, placeholder: "+225 00 00 00 00" },
    { key: "site_logo", label: "URL du logo", icon: ImageIcon, placeholder: "https://..." },
    { key: "site_url", label: "URL du site", icon: Globe, placeholder: "https://rmb.ci" },
  ];

  return (
    <div className="space-y-8 animate-fadeInUp max-w-3xl mx-auto pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <Settings size={28} className="text-primary" />
            Paramètres du site
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gérez les informations de contact et l'apparence globale
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map(({ key, label, icon: Icon, placeholder, type }) => (
            <div key={key} className={key === "contact_address" ? "md:col-span-2" : ""}>
              <label className="text-sm font-medium text-text mb-2 flex items-center gap-2">
                <Icon size={16} className="text-primary" />
                {label}
              </label>
              <input
                type={type || "text"}
                value={form[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span className="ml-2">Enregistrer les paramètres</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}