import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { LivePlayer } from "@/components/live/LivePlayer";
import { LiveChat } from "@/components/live/LiveChat";
import { ArrowLeft, Radio } from "lucide-react";
import Link from "next/link";
import { ShareButton } from "@/components/live/ShareButton"; // ← composant client

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

  return (
    <div className="min-h-screen flex flex-col bg-bkg">
      {/* En-tête immersif */}
      <div className="sticky top-14 md:top-0 z-30 bg-gradient-to-r from-red-500/10 via-primary/5 to-transparent backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/live"
            className="p-1.5 rounded-full hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} className="text-text" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="text-lg font-semibold text-text truncate max-w-[200px] md:max-w-md">
              {live.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {live.host.avatar ? (
                <img src={live.host.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <Radio size={14} className="text-primary" />
              )}
            </div>
            <span className="hidden sm:inline">
              {live.host.firstName} {live.host.lastName}
            </span>
          </div>
          {/* ✅ Remplacement du bouton avec onClick par le composant client */}
          <ShareButton />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-4 p-4 min-h-0">
        {/* Lecteur vidéo */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
            <LivePlayer roomId={live.roomId} />
            {/* Overlay discret avec le titre en bas */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
              <h2 className="text-white font-semibold text-lg drop-shadow-lg">{live.title}</h2>
              {live.description && (
                <p className="text-white/80 text-sm mt-1">{live.description}</p>
              )}
            </div>
          </div>

          {/* Description (sous la vidéo sur mobile) */}
          {live.description && (
            <div className="card-premium p-4 lg:hidden">
              <p className="text-text-secondary text-sm">{live.description}</p>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="card-premium !p-0 flex flex-col overflow-hidden h-[400px] lg:h-full">
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