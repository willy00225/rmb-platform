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
      <div className="flex items-center gap-3">
        <span className="animate-pulse w-3 h-3 rounded-full bg-red-500" />
        <h1 className="text-2xl font-display font-bold text-white">{live.title}</h1>
        <p className="text-gray-400 text-sm">par {live.host.firstName} {live.host.lastName}</p>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        <div className="lg:col-span-3 aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
          <LivePlayer roomId={live.roomId} />
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-surface-dark">
          <LiveChat channelId={live.channelId!} session={session} />
        </div>
      </div>
    </div>
  );
}