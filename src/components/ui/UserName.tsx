"use client";
import { useEffect, useState } from "react";
import { PremiumBadge } from "./PremiumBadge";

export function UserName({
  userId,
  firstName,
  lastName,
  isPremium: isPremiumProp, // nouvelle prop optionnelle
}: {
  userId: string;
  firstName: string;
  lastName: string;
  isPremium?: boolean; // si fourni, évite l'appel API
}) {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Si le parent a déjà fourni la valeur, on ne fait pas l'appel
    if (isPremiumProp !== undefined) {
      setIsPremium(isPremiumProp);
      return;
    }

    // Sinon, on interroge l'API
    fetch(`/api/users/${userId}/premium`)
      .then(res => res.json())
      .then(data => setIsPremium(data.isPremium))
      .catch(() => {});
  }, [userId, isPremiumProp]);

  return (
    <span className="inline-flex items-center gap-1">
      {firstName} {lastName}
      <PremiumBadge isPremium={isPremium} />
    </span>
  );
}