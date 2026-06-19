"use client";
import { useEffect, useState } from "react";
import { PremiumBadge } from "./PremiumBadge";

export function UserName({
  userId,
  firstName,
  lastName,
}: {
  userId: string;
  firstName: string;
  lastName: string;
}) {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Vérifier le statut premium via l'API
    fetch(`/api/users/${userId}/premium`)
      .then(res => res.json())
      .then(data => setIsPremium(data.isPremium))
      .catch(() => {});
  }, [userId]);

  return (
    <span className="inline-flex items-center">
      {firstName} {lastName}
      <PremiumBadge isPremium={isPremium} />
    </span>
  );
}