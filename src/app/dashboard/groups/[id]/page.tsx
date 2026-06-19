import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Users } from "lucide-react";

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  // ✅ Vérifier que params.id existe bien
  if (!params.id) return notFound();

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
      posts: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: "desc" } },
      creator: { select: { firstName: true, lastName: true } },
    },
  });
  if (!group) notFound();

  const isMember = group.members.some(m => m.userId === session.user.id);

  return (
    <div className="space-y-8 animate-fadeInUp pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text break-words">
            {group.name}
          </h1>
          <p className="text-text-secondary mt-1">{group.description || "Aucune description"}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Users size={14} /> {group.members.length} membres
            </span>
            <span className="hidden sm:inline">·</span>
            <span>Créé par {group.creator.firstName}</span>
          </div>
        </div>

        {!isMember ? (
          <form action={async () => {
            "use server";
            const res = await fetch(`${process.env.NEXTAUTH_URL}/api/groups/${params.id}/join`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: session.user.id }),
            });
            if (res.ok) redirect(`/dashboard/groups/${params.id}`);
          }}>
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
        <h2 className="text-lg font-semibold text-text">Publications du groupe</h2>
        {group.posts.length === 0 ? (
          <div className="rounded-[var(--radius-card)] bg-white border border-border p-6 text-center text-text-secondary">
            Aucune publication pour le moment.
          </div>
        ) : (
          group.posts.map(post => (
            <div key={post.id} className="rounded-[var(--radius-card)] bg-white border border-border p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {post.user.firstName[0]}{post.user.lastName[0]}
                </div>
                <span className="text-text text-sm font-medium">{post.user.firstName} {post.user.lastName}</span>
                <span className="text-xs text-text-secondary ml-auto">
                  {new Date(post.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="text-text-secondary break-words">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}