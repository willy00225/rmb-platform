import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { LivePlayer } from "@/components/live/LivePlayer";
import { LiveChat } from "@/components/live/LiveChat";
import { ArrowLeft, Radio } from "lucide-react";
import Link from "next/link";
import { ShareButton } from "@/components/live/ShareButton";
import { EndLiveButton } from "@/components/live/EndLiveButton";

export default async function LiveRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  const live = await prisma.live.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
  if (!live) notFound();

  const isHost = session.user.id === live.hostId;

  return (
    <div className="h-screen flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:h-full lg:min-h-0 lg:gap-4 lg:p-4">
      {/* En-tête (header) - visible aussi en mode live, mais sans sidebars */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 bg-gradient-to-r from-red-500/10 via-primary/5 to-transparent backdrop-blur-md border-b border-border lg:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/live" className="p-1.5 rounded-full hover:bg-white/10 transition">
            <ArrowLeft size={20} className="text-text" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="text-lg font-semibold text-text truncate max-w-[200px]">{live.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton />
          {isHost && <EndLiveButton liveId={live.id} />}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-4 lg:p-4">
        {/* Lecteur vidéo + description */}
        <div className="flex-shrink-0 lg:flex lg:flex-col lg:space-y-4 lg:min-w-0">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
            <LivePlayer roomId={live.roomId} />
            {/* Overlay discret */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
              <h2 className="text-white font-semibold text-lg drop-shadow-lg">{live.title}</h2>
              {live.description && (
                <p className="text-white/80 text-sm mt-1">{live.description}</p>
              )}
            </div>
          </div>
          {/* Description visible seulement sur mobile */}
          {live.description && (
            <div className="card-premium p-4 lg:hidden">
              <p className="text-text-secondary text-sm">{live.description}</p>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-surface rounded-t-2xl lg:rounded-2xl overflow-hidden lg:h-full">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-text">💬 Chat en direct</span>
            <span className="text-xs text-text-secondary">Stream Chat</span>
          </div>
          <div className="flex-1 min-h-0">
            <LiveChat channelId={live.channelId!} session={session} />
          </div>
        </div>
      </div>
    </div>
  );
}