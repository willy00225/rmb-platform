"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventCard } from "@/components/events/EventCard";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Loader2, CalendarPlus, CalendarDays, Sparkles } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  imageUrl?: string;
  organizer: { firstName: string; lastName: string };
  _count: { participations: number };
}

export default function EventsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, isError } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: () => fetch("/api/events").then((res) => res.json()),
    staleTime: 1000 * 60 * 2,
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
      toast.error("Vous êtes déjà inscrit ou une erreur est survenue.");
    },
  });

  const handleRegister = (eventId: string) => {
    registerMutation.mutate(eventId);
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text flex items-center gap-3">
              <CalendarDays size={36} className="text-primary" />
              Événements
            </h1>
            <p className="text-text-secondary mt-2 max-w-xl">
              Découvrez les événements de la communauté et participez à ceux qui vous intéressent.
            </p>
          </div>
          {events.length > 0 && (
            <span className="text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full">
              {events.length} événement{events.length > 1 ? "s" : ""} à venir
            </span>
          )}
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-secondary animate-pulse">Chargement des événements...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">
          Impossible de charger les événements. Veuillez réessayer.
        </div>
      ) : events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-text-secondary"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CalendarPlus size={40} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Aucun événement pour le moment</h2>
          <p className="text-text-secondary text-sm max-w-md text-center">
            Revenez bientôt pour découvrir les prochains rassemblements, ou contactez un administrateur pour en proposer un.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -4 }}
              className="h-full"
            >
              <EventCard
                event={event}
                onRegister={() => handleRegister(event.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}