"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2, MapPin, Tag, ShoppingCart, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetch(`/api/marketplace/${id}`).then(res => res.json()),
  });

  const handleBuy = async () => {
    const res = await fetch("/api/marketplace/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      toast.error("Erreur lors de l'achat.");
    }
  };

  if (isLoading) return <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />;
  if (!product) return <p className="text-text-secondary">Produit introuvable.</p>;

  const isOwner = product.userId === session?.user?.id;

  return (
    <div className="space-y-8 animate-fadeInUp max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-primary hover:underline text-sm">&larr; Retour</button>
      <div className="rounded-2xl bg-white dark:bg-surface border border-border overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.title} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-64 bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <Tag size={48} className="text-text-secondary" />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text">{product.title}</h1>
          <p className="text-primary font-bold text-xl mt-2">{product.price.toLocaleString()} FCFA</p>
          {product.location && (
            <p className="text-text-secondary flex items-center gap-1 mt-2"><MapPin size={16} /> {product.location}</p>
          )}
          <p className="text-text-secondary mt-4">{product.description}</p>
          <p className="text-text-secondary text-sm mt-4">Vendu par {product.user?.firstName} {product.user?.lastName}</p>
          {product.status === "active" && !isOwner && (
            <Button onClick={handleBuy} variant="primary" size="lg" className="mt-6 w-full">
              <ShoppingCart size={20} /> Acheter
            </Button>
          )}
          {product.status === "sold" && (
            <p className="text-red-500 mt-4 font-medium">Vendu</p>
          )}
        </div>
      </div>
    </div>
  );
}