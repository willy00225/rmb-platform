"use client";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Loader2, Save, Camera, ImagePlus, Bell, BellOff } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Types pour les préférences de notification
interface NotificationPrefs {
  [key: string]: boolean;
}

// Clés et libellés affichés dans l'interface
const NOTIFICATION_LABELS: Record<string, string> = {
  push_enabled: "🔔 Notifications push globales",
  email_enabled: "📧 Notifications email globales",
  new_message: "Nouveau message",
  new_follower: "Nouvel abonné",
  new_comment: "Nouveau commentaire",
  post_liked: "J'aime sur une publication",
  page_followed: "Abonnement à une page",
  challenge_reminder: "Rappel de défi",
  event_reminder: "Rappel d'événement",
  marketing: "Actualités et offres",
};

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [firstName, setFirstName] = useState(session?.user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(session?.user?.name?.split(" ")[1] || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState("");
  const [fonction, setFonction] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // 🔔 État pour les préférences de notification
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({});
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Charger les préférences au montage
  useEffect(() => {
    fetch("/api/profile/notifications")
      .then((res) => res.json())
      .then((data) => setNotifPrefs(data))
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    const body: Record<string, unknown> = { firstName, lastName, email, phone, fonction };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Profil mis à jour.");
      update();
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur");
    }
    setLoading(false);
  };

  const handleSaveNotifications = async () => {
    setSavingNotifs(true);
    try {
      const res = await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifPrefs),
      });
      if (res.ok) {
        toast.success("Préférences de notifications enregistrées");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleNotifToggle = (key: string, value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "avatar");
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      });
      toast.success("Photo de profil mise à jour.");
      update();
      router.refresh();
    }
    setAvatarUploading(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "cover");
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: url }),
      });
      toast.success("Photo de couverture mise à jour.");
      update();
      router.refresh();
    }
    setCoverUploading(false);
  };

  return (
    <div className="space-y-8 animate-fadeInUp max-w-lg mx-auto">
      <h1 className="text-3xl font-display font-bold text-text">Paramètres</h1>

      <div className="card-premium p-6 space-y-6">
        {/* Photo de couverture */}
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">Photo de couverture</h2>
          <div
            className="h-32 rounded-xl bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverUploading ? (
              <Loader2 className="animate-spin text-primary" size={24} />
            ) : (
              <div className="text-center text-text-secondary">
                <ImagePlus size={24} className="mx-auto mb-1" />
                <span className="text-sm">Ajouter une couverture</span>
              </div>
            )}
            <input type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" />
          </div>
        </div>

        {/* Photo de profil */}
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">Photo de profil</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
              {firstName[0]}{lastName[0]}
            </div>
            <label className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:underline">
              <Camera size={16} />
              {avatarUploading ? "Upload..." : "Changer la photo"}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Champs texte */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary">Prénom</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text" />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Nom</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text" />
          </div>
        </div>
        <div>
          <label className="text-sm text-text-secondary">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text" />
        </div>
        <div>
          <label className="text-sm text-text-secondary">Téléphone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text" />
        </div>
        <div>
          <label className="text-sm text-text-secondary">Fonction / Profession</label>
          <input type="text" value={fonction} onChange={e => setFonction(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text" />
        </div>

        {/* Mot de passe */}
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">Changer le mot de passe</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary">Mot de passe actuel</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text" />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text" />
            </div>
          </div>
        </div>

        <Button onClick={handleSaveProfile} disabled={loading} variant="primary" size="lg" className="w-full">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span className="ml-2">Enregistrer les modifications</span>
        </Button>
      </div>

      {/* 🔔 Notifications */}
      <div className="card-premium p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text">Notifications</h2>
        <p className="text-sm text-text-secondary">
          Gérez vos préférences de notification pour rester informé sans être submergé.
        </p>

        {Object.keys(notifPrefs).length === 0 ? (
          <div className="text-center py-4 text-text-secondary text-sm">Aucune préférence enregistrée.</div>
        ) : (
          <div className="space-y-4">
            {/* Interrupteurs globaux */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  {notifPrefs.push_enabled ? <Bell size={16} className="text-primary" /> : <BellOff size={16} className="text-text-secondary" />}
                  <span className={notifPrefs.push_enabled ? "text-text" : "text-text-secondary"}>Push</span>
                </div>
                <button
                  onClick={() => handleNotifToggle("push_enabled", !notifPrefs.push_enabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${notifPrefs.push_enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifPrefs.push_enabled ? "translate-x-4" : ""}`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  {notifPrefs.email_enabled ? <Bell size={16} className="text-primary" /> : <BellOff size={16} className="text-text-secondary" />}
                  <span className={notifPrefs.email_enabled ? "text-text" : "text-text-secondary"}>Email</span>
                </div>
                <button
                  onClick={() => handleNotifToggle("email_enabled", !notifPrefs.email_enabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${notifPrefs.email_enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifPrefs.email_enabled ? "translate-x-4" : ""}`} />
                </button>
              </div>
            </div>

            {/* Notifications par type d'événement */}
            <div className="space-y-3">
              {Object.entries(NOTIFICATION_LABELS)
                .filter(([key]) => key !== "push_enabled" && key !== "email_enabled")
                .map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3">
                    <span className="text-sm text-text">{label}</span>
                    <button
                      onClick={() => handleNotifToggle(key, !notifPrefs[key])}
                      className={`relative w-10 h-6 rounded-full transition-colors ${notifPrefs[key] ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifPrefs[key] ? "translate-x-4" : ""}`} />
                    </button>
                  </div>
                ))}
            </div>

            <Button onClick={handleSaveNotifications} disabled={savingNotifs} variant="primary" size="sm" className="w-full">
              {savingNotifs ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span className="ml-2">Enregistrer les préférences de notification</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}