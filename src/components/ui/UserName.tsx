"use client";
import Link from "next/link";
import { PremiumBadge } from "./PremiumBadge";
import { useQuery } from "@tanstack/react-query";

export function UserName({
  userId,
  firstName,
  lastName,
  isPremium: isPremiumProp,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  isPremium?: boolean;
}) {
  // Utilisation de React Query pour un cache performant
  const { data: isPremium } = useQuery({
    queryKey: ["user-premium", userId],
    queryFn: () =>
      fetch(`/api/users/${userId}/premium`)
        .then((res) => res.json())
        .then((data) => data.isPremium),
    // N'appelle l'API que si la prop n'est pas fournie
    enabled: isPremiumProp === undefined,
    // Garde en cache pendant 10 minutes pour éviter les appels répétés
    staleTime: 10 * 60 * 1000,
    // Utilise le cache même si les données sont considérées comme périmées
    gcTime: 30 * 60 * 1000,
    // Évite un appel API si la donnée est déjà en cache
    refetchOnWindowFocus: false,
  });

  const showBadge = isPremiumProp !== undefined ? isPremiumProp : isPremium;

  return (
    <Link
      href={`/dashboard/profile/${userId}`}
      className="inline-flex items-center gap-1 hover:underline hover:text-primary transition-colors group"
      prefetch={false} // Évite le prefetch inutile pour ne pas surcharger le réseau
    >
      <span className="font-medium group-hover:text-primary transition-colors">
        {firstName} {lastName}
      </span>
      <PremiumBadge isPremium={showBadge} />
    </Link>
  );
}