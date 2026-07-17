import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { EventDetailClient } from "./_components/EventDetailClient";

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
      organizer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      _count: { select: { participations: true } },
      participations: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
  });

  if (!event) notFound();

  const alreadyRegistered = event.participations.length > 0;

  async function registerAction() {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const existing = await prisma.participation.findFirst({
      where: { eventId: id, userId: session.user.id },
    });
    if (existing) return;

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
    <EventDetailClient
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        location: event.location,
        imageUrl: event.imageUrl,
        organizer: event.organizer,
        participantCount: event._count.participations,
      }}
      alreadyRegistered={alreadyRegistered}
      registerAction={registerAction}
    />
  );
}