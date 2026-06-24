"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// Types pour les événements
interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
}

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);

  const { data: events = [], isLoading } = useQuery<AdminEvent[]>({
    queryKey: ["admin-events"],
    queryFn: () => fetch("/api/admin/events").then(res => res.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) =>
      fetch(`/api/admin/events/${eventId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Événement supprimé.");
    },
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text dark:text-white">
          Gestion des événements
        </h1>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={18} /> Créer un événement
        </Button>
      </div>

      {showForm && (
        <EventForm
          event={editingEvent}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["admin-events"] });
          }}
        />
      )}

      {isLoading ? (
        <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />
      ) : events.length === 0 ? (
        <p className="text-text-secondary italic">Aucun événement pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 gap-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-text dark:text-white text-lg">
                  {event.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-secondary dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} />
                    {new Date(event.startDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} />
                      {event.location}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="mt-2 text-text-secondary dark:text-gray-500 text-sm line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link href={`/dashboard/admin/events/${event.id}/checkin`}>
                  <Button size="sm" variant="secondary">
                    <QrCode size={16} /> Scanner
                  </Button>
                </Link>
                <button
                  onClick={() => handleEdit(event)}
                  className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  title="Modifier"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Supprimer cet événement ?")) {
                      deleteMutation.mutate(event.id);
                    }
                  }}
                  className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Formulaire d'ajout/modification (amélioré)
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
    event ? event.endDate?.slice(0, 16) : ""
  );
  const [location, setLocation] = useState(event?.location || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const url = event
      ? `/api/admin/events/${event.id}`
      : "/api/admin/events";
    const method = event ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        startDate,
        endDate: endDate || null,
        location,
      }),
    });
    if (res.ok) {
      toast.success(event ? "Événement modifié" : "Événement créé");
      onSuccess();
    } else {
      toast.error("Erreur");
    }
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 space-y-4 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-text dark:text-white">
        {event ? "Modifier l'événement" : "Nouvel événement"}
      </h2>
      <input
        type="text"
        placeholder="Titre de l'événement"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
      />
      <textarea
        placeholder="Description (optionnelle)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition resize-y"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-text-secondary mb-1 block">
            Date de début
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1 block">
            Date de fin (optionnelle)
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
          />
        </div>
      </div>
      <div>
        <label className="text-sm text-text-secondary mb-1 block">
          Lieu (optionnel)
        </label>
        <input
          type="text"
          placeholder="Adresse ou lieu"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting
            ? "Enregistrement..."
            : event
            ? "Modifier"
            : "Créer l'événement"}
        </Button>
      </div>
    </form>
  );
}