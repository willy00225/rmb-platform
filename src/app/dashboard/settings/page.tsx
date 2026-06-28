"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Loader2, Save, Camera, ImagePlus } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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

  const handleSave = async () => {
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "avatar");   // ✅ ajouté
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
    formData.append("type", "cover");   // ✅ ajouté
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

        <Button onClick={handleSave} disabled={loading} variant="primary" size="lg" className="w-full">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span className="ml-2">Enregistrer les modifications</span>
        </Button>
      </div>
    </div>
  );
}