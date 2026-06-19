"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventCard } from "@/components/events/EventCard";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Loader2, CalendarPlus } from "lucide-react";

export default function EventsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: () => fetch("/api/events").then(res => res.json()),
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events/${eventId}/register`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur d'inscription");
      return eventId;
    },
    onSuccess: () => {
      toast.success("Inscription réussie !");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => {
      toast.error("Vous êtes déjà inscrit ou erreur.");
    },
  });

  const handleRegister = (eventId: string) => {
    registerMutation.mutate(eventId);
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Événements</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <CalendarPlus size={48} className="mb-4" />
          <p className="text-lg">Aucun événement pour le moment.</p>
          <p className="text-sm">Revenez bientôt ou contactez un administrateur.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <EventCard key={event.id} event={event} onRegister={() => handleRegister(event.id)} />
          ))}
        </div>
      )}
    </div>
  );
}