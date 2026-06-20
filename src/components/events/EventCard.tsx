"use client";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  location?: string | null;
  imageUrl?: string | null;
  organizer: { firstName: string; lastName: string };
  _count: { participations: number };
}

export function EventCard({ event, onRegister }: { event: Event; onRegister?: () => void }) {
  const date = new Date(event.startDate);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6"
    >
      {event.imageUrl && (
        <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover rounded-xl mb-4" />
      )}
      <h3 className="text-xl font-bold text-text">{event.title}</h3>
      <p className="text-text-secondary text-sm mt-2 line-clamp-2">{event.description}</p>
      <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary">
        <span className="flex items-center gap-1"><CalendarDays size={14} /> {date.toLocaleDateString("fr-FR")} à {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
        {event.location && <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border dark:border-white/10">
        <span className="flex items-center gap-1 text-sm text-text-secondary"><Users size={14} /> {event._count.participations} participant(s)</span>
        {onRegister && (
          <button onClick={onRegister} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition">
            S’inscrire
          </button>
        )}
      </div>
    </motion.div>
  );
}