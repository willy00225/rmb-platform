"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [city, setCity] = useState("");
  const [village, setVillage] = useState("");
  const [canton, setCanton] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [currentVillage, setCurrentVillage] = useState("");
  const [currentCountry, setCurrentCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [fonction, setFonction] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        dateOfBirth: dateOfBirth || null,
        city: city || null,
        village: village || null,
        canton: canton || null,
        currentCity: currentCity || null,
        currentVillage: currentVillage || null,
        currentCountry: currentCountry || null,
        phone: phone || null,
        fonction: fonction || null,
      }),
    });

    setLoading(false);
    if (res.ok) {
      toast.success("Compte créé avec succès !");
      router.push("/auth/login");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur lors de l'inscription.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bkg p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl"
      >
        {/* Logo + titre */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img
              src="/images/logo-rmb.png"
              alt="RMB"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-display font-bold text-primary">
            Créez votre compte
          </h1>
          <p className="text-text-secondary mt-1">
            Rejoignez le réseau mondial des Bétés
          </p>
        </div>

        <div className="bg-white border border-border rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom et prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            {/* Email et mot de passe */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition pr-12"
                  placeholder="8 caractères minimum"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Date de naissance */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Date de naissance
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
              />
            </div>

            {/* Origine */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Ville d'origine
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  placeholder="Ex : Gagnoa"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Village
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  placeholder="Votre village"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Canton
              </label>
              <input
                type="text"
                value={canton}
                onChange={(e) => setCanton(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                placeholder="Canton"
              />
            </div>

            {/* Résidence actuelle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Ville actuelle
                </label>
                <input
                  type="text"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  placeholder="Ex : Abidjan"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Village actuel
                </label>
                <input
                  type="text"
                  value={currentVillage}
                  onChange={(e) => setCurrentVillage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  placeholder="Village actuel"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Pays actuel
              </label>
              <input
                type="text"
                value={currentCountry}
                onChange={(e) => setCurrentCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                placeholder="Ex : Côte d'Ivoire"
              />
            </div>

            {/* Téléphone et fonction */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  placeholder="+225 07 00 00 00 00"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Fonction / Profession
                </label>
                <input
                  type="text"
                  value={fonction}
                  onChange={(e) => setFonction(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  placeholder="Ex : Enseignant, Étudiant..."
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
            >
              <UserPlus size={18} />
              Créer mon compte
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            Déjà membre ?{" "}
            <Link
              href="/auth/login"
              className="text-secondary hover:text-secondary-hover font-medium"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}