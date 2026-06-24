"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function OneSignalRegistrar() {
  const { data: session } = useSession();

  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.OneSignalDeferred.push((OneSignal: any) => {
      if (session?.user?.id) {
        OneSignal.login(session.user.id);
      } else {
        OneSignal.logout();
      }
    });
  }, [session?.user?.id]);

  return null;
}