"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function OneSignalRegistrar() {
  const { data: session } = useSession();

  useEffect(() => {
    // On s'assure que le SDK OneSignal est initialisé avant d'agir
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      if (session?.user?.id) {
        // L'utilisateur est connecté → on le lie à OneSignal
        OneSignal.login(session.user.id);
      } else {
        // Pas d'utilisateur → on libère l'identifiant précédent
        OneSignal.logout();
      }
    });
  }, [session?.user?.id]);

  return null;
}