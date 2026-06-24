import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Calendar, MapPin, Clock, Users, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { firstName: true, lastName: true } },
      _count: { select: { participations: true } },
    },
  });

  if (!event) notFound();

  // Utilisation de findFirst au lieu de findUnique pour éviter l'erreur de typage
  const alreadyRegistered = await prisma.participation.findFirst({
    where: {
      eventId: event.id,
      userId: session.user.id,
    },
  });

  async function registerAction() {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    await prisma.participation.create({
      data: {
        eventId: id,
        userId: session.user.id,
        status: "REGISTERED",
      },
    });
    revalidatePath(`/dashboard/events/${id}`);
    redirect(`/dashboard/events/${id}`);
  }

  return (
    <div className="space-y-8 animate-fadeInUp max-w-2xl mx-auto">
      {/* Bouton retour */}
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition"
      >
        <ArrowLeft size={16} />
        Retour aux événements
      </Link>

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text dark:text-white">
          {event.title}
        </h1>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-secondary dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Calendar size={16} />
            {new Date(event.startDate).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={16} />
            {new Date(event.startDate).toLocaleTimeString("fr-FR", {
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
          <span className="flex items-center gap-1.5">
            <Users size={16} />
            {event._count.participations} participant{event._count.participations > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold text-text dark:text-white mb-3">
            À propos de cet événement
          </h2>
          <p className="text-text-secondary whitespace-pre-line">{event.description}</p>
        </div>
      )}

      {/* Image */}
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-64 md:h-96 object-cover rounded-2xl"
        />
      )}

      {/* Inscription */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold text-text dark:text-white mb-4">
          Inscription
        </h2>
        {alreadyRegistered ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle size={20} />
            <span>Vous êtes déjà inscrit à cet événement.</span>
          </div>
        ) : (
          <form action={registerAction}>
            <Button type="submit" variant="primary" size="lg">
              S&apos;inscrire à l&apos;événement
            </Button>
          </form>
        )}
      </div>

      {/* Organisateur */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold text-text dark:text-white mb-3">
          Organisé par
        </h2>
        <p className="text-text-secondary">
          {event.organizer.firstName} {event.organizer.lastName}
        </p>
      </div>
    </div>
  );
}