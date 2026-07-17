"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  MapPin,
  Tag,
  ShoppingCart,
  MessageCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useChat } from "@/contexts/ChatContext";
import { MediaViewer } from "@/components/ui/MediaViewer"; // ✅ réutilisation

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { openChatWithFriend } = useChat();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetch(`/api/marketplace/${id}`).then((res) => res.json()),
  });

  const handleBuy = async () => {
    if (!confirm("Confirmez-vous l'achat de cet article ?")) return;
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

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );

  if (isError || !product)
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary text-lg">Produit introuvable.</p>
        <Button onClick={() => router.back()} variant="secondary" className="mt-4">
          Retour
        </Button>
      </div>
    );

  const isOwner = product.userId === session?.user?.id;
  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images.length > 0 ? images[currentImageIndex] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeInUp py-8 px-4">
      {/* Retour */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition"
      >
        <ArrowLeft size={18} />
        Retour au marketplace
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Galerie d'images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-border">
            {currentImage ? (
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={currentImage}
                alt={product.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary">
                <Tag size={64} className="opacity-30" />
              </div>
            )}
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? images.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === images.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {images.length > 0 && (
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
              >
                <Eye size={18} />
              </button>
            )}
          </div>

          {/* Miniatures */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${
                    index === currentImageIndex
                      ? "border-primary"
                      : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informations produit */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wide">
              {product.category ? product.category : "Non catégorisé"}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-text mt-1">
              {product.title}
            </h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              {product.price.toLocaleString()}
            </span>
            <span className="text-text-secondary">FCFA</span>
          </div>

          {product.location && (
            <p className="flex items-center gap-1.5 text-text-secondary">
              <MapPin size={18} /> {product.location}
            </p>
          )}

          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-text">Description</h3>
            <p className="text-text-secondary text-sm whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="flex items-center gap-1.5">
              <User size={16} />
              <span>
                {product.user?.firstName} {product.user?.lastName}
              </span>
            </div>
            {product.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                <span>
                  {new Date(product.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {product.status === "active" && !isOwner && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleBuy}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                <ShoppingCart size={20} className="mr-2" />
                Acheter maintenant
              </Button>
              <Button
                onClick={() => openChatWithFriend(product.userId)}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                <MessageCircle size={20} className="mr-2" />
                Contacter le vendeur
              </Button>
            </div>
          )}

          {product.status === "sold" && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-4 text-center font-medium">
              Cet article a été vendu.
            </div>
          )}

          {isOwner && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl p-4 text-center font-medium">
              C&apos;est votre annonce. Vous ne pouvez pas acheter votre propre
              article.
            </div>
          )}
        </div>
      </div>

      {/* Lightbox (MediaViewer) */}
      {lightboxOpen && currentImage && (
        <MediaViewer
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          src={currentImage}
          type="image"
          caption={product.title}
        />
      )}
    </div>
  );
}