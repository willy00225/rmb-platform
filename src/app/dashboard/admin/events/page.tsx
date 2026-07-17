"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  _count?: { participations: number };
}

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const { data: events = [], isLoading, isError } = useQuery<AdminEvent[]>({
    queryKey: ["admin-events"],
    queryFn: () => fetch("/api/admin/events").then((res) => res.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) =>
      fetch(`/api/admin/events/${eventId}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error("Erreur suppression");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Événement supprimé.");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const handleEdit = (event: AdminEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <Calendar size={28} className="text-primary" />
            Gestion des événements
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Créez, modifiez et gérez les événements de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-3">
          {events.length > 0 && (
            <div className="bg-gray-50 dark:bg-white/5 border border-border rounded-xl px-4 py-2 text-sm font-medium text-text">
              {events.length} événement{events.length > 1 ? "s" : ""}
            </div>
          )}
          <Button onClick={handleCreate} variant="primary">
            <Plus size={18} /> Créer un événement
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <EventForm
              event={editingEvent}
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                queryClient.invalidateQueries({ queryKey: ["admin-events"] });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">
          Erreur de chargement. Veuillez réessayer.
        </div>
      ) : events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calendar size={36} className="text-primary opacity-70" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            Aucun événement
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            Créez votre premier événement pour animer la communauté.
          </p>
          <Button onClick={handleCreate} variant="primary" className="mt-4">
            <Plus size={18} /> Créer un événement
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="space-y-4"
        >
          {events.map((event) => {
            const isExpanded = expandedEvent === event.id;
            const participantCount = event._count?.participations || 0;
            const isPast = new Date(event.startDate) < new Date();

            return (
              <motion.div
                key={event.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`card-premium p-5 transition-all ${
                  isPast ? "opacity-70" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text text-lg truncate">
                        {event.title}
                      </h3>
                      {isPast && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-text-secondary">
                          Passé
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={16} />
                        {new Date(event.startDate).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={16} />
                        {new Date(event.startDate).toLocaleTimeString(
                          "fr-FR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={16} />
                          {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users size={16} />
                        {participantCount} participant
                        {participantCount > 1 ? "s" : ""}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && event.description && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 text-text-secondary text-sm whitespace-pre-line overflow-hidden"
                        >
                          {event.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <Link href={`/dashboard/admin/events/${event.id}/checkin`}>
                      <Button size="sm" variant="secondary">
                        <QrCode size={16} className="mr-1" /> Scanner
                      </Button>
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setExpandedEvent(isExpanded ? null : event.id)
                        }
                        className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition"
                        title={
                          isExpanded ? "Masquer détails" : "Voir détails"
                        }
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition"
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Supprimer définitivement cet événement ?"
                            )
                          ) {
                            deleteMutation.mutate(event.id);
                          }
                        }}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        title="Supprimer"
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === event.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Formulaire amélioré                                                */
/* ------------------------------------------------------------------ */
function EventForm({
  event,
  onClose,
  onSuccess,
}: {
  event?: AdminEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [startDate, setStartDate] = useState(
    event ? event.startDate?.slice(0, 16) : ""
  );
  const [endDate, setEndDate] = useState(
    event?.endDate ? event.endDate.slice(0, 16) : ""
  );
  const [location, setLocation] = useState(event?.location || "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Le titre est requis";
    if (!startDate) errs.startDate = "La date de début est requise";
    if (endDate && new Date(endDate) <= new Date(startDate))
      errs.endDate = "La date de fin doit être après la date de début";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const url = event
      ? `/api/admin/events/${event.id}`
      : "/api/admin/events";
    const method = event ? "PATCH" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          location: location.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success(event ? "Événement modifié" : "Événement créé");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit}
      className="card-premium p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text flex items-center gap-2">
          {event ? <Pencil size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
          {event ? "Modifier l'événement" : "Nouvel événement"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition"
        >
          <Trash2 size={16} className="text-text-secondary" /> {/* icône de fermeture */}
        </button>
      </div>

      <div>
        <label className="text-sm font-medium text-text mb-1 block">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Titre de l'événement"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border ${
            errors.title
              ? "border-red-500"
              : "border-border dark:border-white/10"
          } text-text placeholder-text-secondary focus:outline-none focus:border-primary transition`}
        />
        {errors.title && (
          <p className="text-xs text-red-500 mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-text mb-1 block">
          Description
        </label>
        <textarea
          placeholder="Description de l'événement..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-text mb-1 block">
            Date de début <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border ${
              errors.startDate
                ? "border-red-500"
                : "border-border dark:border-white/10"
            } text-text focus:outline-none focus:border-primary transition`}
          />
          {errors.startDate && (
            <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-text mb-1 block">
            Date de fin
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border ${
              errors.endDate
                ? "border-red-500"
                : "border-border dark:border-white/10"
            } text-text focus:outline-none focus:border-primary transition`}
          />
          {errors.endDate && (
            <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text mb-1 block">
          Lieu
        </label>
        <input
          type="text"
          placeholder="Adresse ou lieu de l'événement"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : event ? (
            <Pencil size={18} />
          ) : (
            <Plus size={18} />
          )}
          <span className="ml-2">
            {submitting
              ? "Enregistrement..."
              : event
              ? "Modifier"
              : "Créer l'événement"}
          </span>
        </Button>
      </div>
    </motion.form>
  );
}