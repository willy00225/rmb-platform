import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Users } from "lucide-react";
import { revalidatePath } from "next/cache";
import { PostCard } from "@/components/community/PostCard"; // ✅ import ajouté

export const dynamic = 'force-dynamic';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
      posts: {
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      creator: { select: { firstName: true, lastName: true } },
    },
  });
  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === session.user.id);

  async function joinAction() {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    await fetch(`${process.env.NEXTAUTH_URL}/api/groups/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id }),
    });
    revalidatePath(`/dashboard/groups/${id}`);
    redirect(`/dashboard/groups/${id}`);
  }

  // ✅ Transformer les GroupPost en objets Post pour PostCard
  const serializedPosts = group.posts.map((p) => ({
    id: p.id,
    content: p.content,
    mediaUrl: null,                // les GroupPost n'ont pas de média actuellement, mais on peut adapter
    mediaType: null,
    createdAt: p.createdAt.toISOString(),
    userId: p.userId,
    user: {
      id: p.userId,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      avatar: null,
      isPremium: false,            // si vous gérez le premium, vous pouvez l'ajouter
    },
    comments: [],                  // pas encore de commentaires de groupe, mais l'API les renverra
    likes: [],
    sharesCount: 0,
    sharedPost: null,
  }));

  return (
    <div className="space-y-8 animate-fadeInUp pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text break-words">
            {group.name}
          </h1>
          <p className="text-text-secondary mt-1">
            {group.description || "Aucune description"}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Users size={14} /> {group.members.length} membres
            </span>
            <span className="hidden sm:inline">·</span>
            <span>Créé par {group.creator.firstName}</span>
          </div>
        </div>

        {!isMember ? (
          <form action={joinAction}>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              <Users size={16} /> Rejoindre le groupe
            </Button>
          </form>
        ) : (
          <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium flex items-center gap-2 w-full sm:w-auto justify-center">
            <Users size={16} /> Membre
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">
          Publications du groupe
        </h2>
        {serializedPosts.length === 0 ? (
          <div className="card-premium p-6 text-center text-text-secondary">
            Aucune publication pour le moment.
          </div>
        ) : (
          serializedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={session.user.id}
              // Vous pouvez ajouter onShare et onDelete comme pour le fil principal
            />
          ))
        )}
      </div>
    </div>
  );
}