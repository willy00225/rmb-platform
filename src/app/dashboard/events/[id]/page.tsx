"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  User,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  imageUrl: string | null;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  participantCount: number;
}

export function EventDetailClient({
  event,
  alreadyRegistered,
  registerAction,
}: {
  event: EventData;
  alreadyRegistered: boolean;
  registerAction: () => Promise<void>;
}) {
  const handleShare = () => {
    const url = `${window.location.origin}/dashboard/events/${event.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Lien copié dans le presse-papiers !");
    });
  };

  return (
    <div className="space-y-8 animate-fadeInUp max-w-3xl mx-auto pb-10">
      {/* Bouton retour */}
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition"
      >
        <ArrowLeft size={16} />
        Retour aux événements
      </Link>

      {/* Bannière image */}
      {event.imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-64 md:h-80 rounded-2xl overflow-hidden"
        >
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
              {event.title}
            </h1>
          </div>
        </motion.div>
      )}

      {/* Titre si pas d'image */}
      {!event.imageUrl && (
        <h1 className="text-3xl font-display font-bold text-text">
          {event.title}
        </h1>
      )}

      {/* Infos principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Date</p>
            <p className="text-sm font-medium text-text">
              {new Date(event.startDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Horaire</p>
            <p className="text-sm font-medium text-text">
              {new Date(event.startDate).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {new Date(event.endDate).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        {event.location && (
          <div className="card-premium p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Lieu</p>
              <p className="text-sm font-medium text-text">{event.location}</p>
            </div>
          </div>
        )}
        <div className="card-premium p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Participants</p>
            <p className="text-sm font-medium text-text">
              {event.participantCount} inscrit{event.participantCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6"
        >
          <h2 className="text-lg font-semibold text-text mb-3">
            À propos de cet événement
          </h2>
          <p className="text-text-secondary whitespace-pre-line leading-relaxed">
            {event.description}
          </p>
        </motion.div>
      )}

      {/* Organisateur */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Organisé par</h2>
        <Link
          href={`/dashboard/profile/${event.organizer.id}`}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {event.organizer.avatar ? (
              <img
                src={event.organizer.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={24} className="text-primary" />
            )}
          </div>
          <div>
            <p className="text-text font-medium">
              {event.organizer.firstName} {event.organizer.lastName}
            </p>
            <p className="text-xs text-text-secondary">Voir le profil</p>
          </div>
        </Link>
      </div>

      {/* Actions : inscription / partage */}
      <div className="card-premium p-6 flex flex-col sm:flex-row gap-4 items-center">
        {alreadyRegistered ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 flex-1">
            <CheckCircle size={20} />
            <span className="font-medium">Vous êtes déjà inscrit à cet événement.</span>
          </div>
        ) : (
          <form action={registerAction} className="flex-1">
            <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
              S&apos;inscrire à l&apos;événement
            </Button>
          </form>
        )}
        <Button
          variant="secondary"
          size="lg"
          onClick={handleShare}
          className="w-full sm:w-auto"
        >
          <Share2 size={18} className="mr-2" />
          Partager
        </Button>
      </div>
    </div>
  );
}