import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { LivePlayer } from "@/components/live/LivePlayer";
import { LiveChat } from "@/components/live/LiveChat";

export default async function LiveRoomPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const live = await prisma.live.findUnique({
    where: { id: params.id },
    include: { host: { select: { firstName: true, lastName: true } } },
  });
  if (!live) notFound();

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* En-tête : indicateur live + titre + auteur */}
      <div className="flex items-center gap-3 px-2">
        <span className="animate-pulse w-3 h-3 rounded-full bg-red-500" />
        <h1 className="text-2xl font-display font-bold text-text">{live.title}</h1>
        <p className="text-text-secondary text-sm">
          par {live.host.firstName} {live.host.lastName}
        </p>
      </div>

      {/* Contenu principal : vidéo + chat */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Lecteur vidéo */}
        <div className="lg:col-span-3 aspect-video rounded-2xl overflow-hidden bg-black">
          <LivePlayer roomId={live.roomId} />
        </div>

        {/* Chat (fond, bordure et texte adaptés au thème) */}
        <div className="card-premium !p-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border text-text font-semibold text-sm">
            💬 Chat du direct
          </div>
          <div className="flex-1 min-h-0">
            <LiveChat channelId={live.channelId!} session={session} />
          </div>
        </div>
      </div>
    </div>
  );
}