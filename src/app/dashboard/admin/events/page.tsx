"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, ScanLine, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

export default function AdminEventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => fetch("/api/admin/events").then(res => res.json()),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Gestion des événements</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-500" size={32} /></div>
      ) : events.length === 0 ? (
        <p className="text-gray-500 italic">Aucun événement pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event: any) => (
            <div
              key={event.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 gap-4"
            >
              <div className="flex-1">
                <p className="text-white font-medium text-lg">{event.title}</p>
                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} /> {new Date(event.startDate).toLocaleDateString("fr-FR")}
                    {event.endDate && ` → ${new Date(event.endDate).toLocaleDateString("fr-FR")}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} /> {event.location}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{event.description}</p>
                )}
              </div>

              <div className="flex-shrink-0">
                <Link href={`/dashboard/admin/events/${event.id}/checkin`}>
                  <Button variant="primary" size="sm">
                    <ScanLine size={16} className="mr-1" /> Check-in
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}