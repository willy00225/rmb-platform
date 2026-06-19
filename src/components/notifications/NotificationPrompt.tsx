"use client";
import { useEffect, useState } from "react";

export function NotificationPrompt() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      try {
        // Dans OneSignal v16, Notifications.permission est une propriété synchrone (chaîne)
        const permission = OneSignal.Notifications.permission;
        if (permission === "granted") {
          setIsSubscribed(true);
        } else if (permission === "default") {
          setShowPrompt(true);
        }
      } catch (err) {
        console.warn("OneSignal pas encore initialisé, réessai plus tard.");
      }
    });
  }, []);

  const handleSubscribe = async () => {
    if (typeof window === "undefined") return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.Notifications.requestPermission();
        const permission = OneSignal.Notifications.permission;
        if (permission === "granted") {
          setIsSubscribed(true);
          setShowPrompt(false);
        }
      } catch (err) {
        console.error("Erreur lors de la demande de permission", err);
      }
    });
  };

  if (!showPrompt || isSubscribed) return null;

  return (
    <div className="fixed bottom-24 left-6 z-40 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg text-white shadow-lg animate-fadeIn">
      <p className="text-sm mb-2">🔔 Activez les notifications pour ne rien manquer.</p>
      <button
        onClick={handleSubscribe}
        className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition"
      >
        Activer
      </button>
    </div>
  );
}