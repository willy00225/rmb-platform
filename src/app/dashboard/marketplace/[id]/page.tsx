import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MapPin, Tag, Calendar, CheckCircle } from "lucide-react";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      purchases: { take: 1 },
    },
  });

  if (!product) notFound();

  const productId = product.id;
  const isOwner = product.userId === session.user.id;
  const isSold = product.purchases.length > 0;

  async function handleBuy() {
    "use server";
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/marketplace/${productId}/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de paiement");
    }
    const { url } = await res.json();
    redirect(url);
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {product.images && product.images.length > 0 ? (
            <>
              <div className="rounded-2xl overflow-hidden border border-border dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-96 object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((src, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden border border-border dark:border-white/10 bg-gray-50 dark:bg-white/5">
                      <img src={src} alt={`${product.title} ${idx}`} className="w-full h-24 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-96 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-text-secondary">
              <Tag size={48} />
            </div>
          )}
        </div>

        {/* Infos produit */}
        <div className="space-y-6">
          <h1 className="text-3xl font-display font-bold text-text">{product.title}</h1>
          <p className="text-3xl font-bold text-primary">{product.price.toLocaleString()} FCFA</p>

          <div className="flex flex-wrap items-center gap-4 text-text-secondary text-sm">
            <span className="flex items-center gap-1">
              <Tag size={16} /> {product.category}
            </span>
            {product.location && (
              <span className="flex items-center gap-1">
                <MapPin size={16} /> {product.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={16} /> {new Date(product.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </div>

          <div className="border-t border-border dark:border-white/10 pt-4">
            <p className="text-text leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Vendeur */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
              {product.user.avatar ? (
                <img src={product.user.avatar} alt={product.user.firstName} className="w-full h-full object-cover" />
              ) : (
                product.user.firstName[0]
              )}
            </div>
            <div>
              <p className="font-medium text-text">{product.user.firstName} {product.user.lastName}</p>
              <p className="text-sm text-text-secondary">Vendeur</p>
            </div>
          </div>

          {/* Actions */}
          {isOwner ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text-secondary text-center">
              C&apos;est votre annonce.
            </div>
          ) : isSold ? (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-center font-medium flex items-center justify-center gap-2">
              <CheckCircle size={20} /> Article vendu
            </div>
          ) : (
            <form action={handleBuy} className="mt-4">
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Acheter maintenant
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}