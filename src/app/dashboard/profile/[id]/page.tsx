import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { UserPlus, ArrowLeft, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { MessageButton } from "./MessageButton"; // ✅ composant client pour le chat

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  // Rediriger si c'est son propre profil
  if (id === session.user.id) {
    redirect("/dashboard/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      email: true,
      level: true,
      xp: true,
      createdAt: true,
      totalDonated: true,
      _count: { select: { posts: true, friendshipsRequested: { where: { status: "ACCEPTED" } }, friendshipsReceived: { where: { status: "ACCEPTED" } } } },
    },
  });

  if (!user) notFound();

  // Calcul du nombre d'amis
  const friendsCount = user._count.friendshipsRequested + user._count.friendshipsReceived;

  // Vérifier l'état de l'amitié
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId: id },
        { requesterId: id, addresseeId: session.user.id },
      ],
    },
  });

  const isPending = friendship?.status === "PENDING";
  const isAccepted = friendship?.status === "ACCEPTED";
  const isRequester = friendship?.requesterId === session.user.id;

  // Server Actions
  async function addFriendAction() {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    await prisma.friendship.create({
      data: {
        requesterId: session.user.id,
        addresseeId: id,
        status: "PENDING",
      },
    });
    redirect(`/dashboard/profile/${id}`);
  }

  async function cancelRequestAction() {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: id },
          { requesterId: id, addresseeId: session.user.id },
        ],
      },
    });

    if (friendship) {
      await prisma.friendship.delete({ where: { id: friendship.id } });
    }
    redirect(`/dashboard/profile/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeInUp py-12">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition">
        <ArrowLeft size={16} />
        Retour
      </Link>

      <div className="card-premium p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary mx-auto">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            `${user.firstName[0]}${user.lastName[0]}`
          )}
        </div>
        <h1 className="text-3xl font-display font-bold text-text dark:text-white mt-4">
          {user.firstName} {user.lastName}
        </h1>
        {user.bio && <p className="text-text-secondary mt-2">{user.bio}</p>}
        <p className="text-sm text-text-secondary mt-1">
          Niveau {user.level} · {user.xp} XP · Membre depuis {new Date(user.createdAt).getFullYear()}
        </p>
        <div className="flex justify-center gap-4 mt-4 text-sm text-text-secondary">
          <span>{user._count.posts} publications</span>
          <span>{friendsCount} amis</span>
          <span>{user.totalDonated.toLocaleString()} FCFA donnés</span>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-6">
          {isAccepted ? (
            <>
              <MessageButton targetUserId={id} />
              <Button variant="secondary" size="lg" disabled>
                <UserCheck size={18} /> Amis
              </Button>
            </>
          ) : isPending && isRequester ? (
            <form action={cancelRequestAction}>
              <Button variant="secondary" size="lg" type="submit">
                <UserX size={18} /> Annuler l'invitation
              </Button>
            </form>
          ) : isPending && !isRequester ? (
            <Button variant="secondary" size="lg" disabled>
              <UserPlus size={18} /> Invitation reçue
            </Button>
          ) : (
            <>
              <form action={addFriendAction}>
                <Button variant="primary" size="lg" type="submit">
                  <UserPlus size={18} /> Ajouter comme ami
                </Button>
              </form>
              <MessageButton targetUserId={id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}