"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarDays, Users, Radio } from "lucide-react";

export function RightSidebar() {
  const { data: events = [] } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: () => fetch("/api/events").then(res => res.json()),
  });

  const { data: friendsOnline = [] } = useQuery({
    queryKey: ["friends-online"],
    queryFn: () => fetch("/api/friends?status=ACCEPTED&online=true").then(res => res.json()),
  });

  return (
    <aside className="hidden lg:block fixed right-0 top-14 w-80 h-[calc(100vh-3.5rem)] overflow-y-auto bg-bkg p-4 space-y-6">
      {/* Événements à venir */}
      <div className="card-premium p-4">
        <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <CalendarDays size={16} /> Événements
        </h3>
        {events.length === 0 ? (
          <p className="text-text-secondary text-xs">Aucun événement à venir.</p>
        ) : (
          <ul className="space-y-2">
            {events.slice(0, 3).map((event: any) => (
              <li key={event.id}>
                <Link href={`/dashboard/events/${event.id}`} className="text-sm text-text hover:text-primary">
                  {event.title}
                </Link>
                <p className="text-text-secondary text-xs">{new Date(event.startDate).toLocaleDateString("fr-FR")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Amis en ligne */}
      <div className="card-premium p-4">
        <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <Users size={16} /> En ligne
        </h3>
        {friendsOnline.length === 0 ? (
          <p className="text-text-secondary text-xs">Aucun ami en ligne.</p>
        ) : (
          <ul className="space-y-2">
            {friendsOnline.slice(0, 10).map((friend: any) => (
              <li key={friend.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <Link href={`/dashboard/profile/${friend.friend.id}`} className="text-sm text-text hover:text-primary">
                  {friend.friend.firstName} {friend.friend.lastName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Radio en direct */}
      <div className="card-premium p-4">
        <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <Radio size={16} /> Radio RMB
        </h3>
        <Link href="/dashboard/radio" className="text-primary text-sm hover:underline">
          Écouter le direct
        </Link>
      </div>

      {/* Publicité (futur emplacement) */}
      <div className="card-premium p-4 text-center text-text-secondary text-xs">
        Espace publicitaire
      </div>
    </aside>
  );
}