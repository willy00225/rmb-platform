"use client";
import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, MapPin, Calendar, Phone, Briefcase } from "lucide-react";

interface MemberCardProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    level: number;
    xp: number;
    createdAt: string;
    dateOfBirth?: string | null;
    city?: string | null;
    village?: string | null;
    canton?: string | null;
    currentCity?: string | null;
    currentVillage?: string | null;
    currentCountry?: string | null;
    phone?: string | null;
    fonction?: string | null;
  };
  parents?: { firstName: string; lastName: string }[];
  siblings?: { firstName: string; lastName: string }[];
}

export const MemberCard = forwardRef<HTMLDivElement, MemberCardProps>(function MemberCard(
  { user, parents = [], siblings = [] },
  ref
) {
  const memberNumber = user.id ? `RMB-${user.id.slice(0, 8).toUpperCase()}` : "RMB-00000000";

  return (
    <div
      ref={ref}
      className="card-premium relative w-full max-w-md mx-auto p-6 overflow-hidden group"
    >
      {/* Motif bété en filigrane */}
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 5 L45 10 L55 30 L40 55 L10 50 L5 25 Z' fill='none' stroke='%23C99619' stroke-width='1.5'/%3E%3Ccircle cx='30' cy='30' r='6' fill='none' stroke='%23005A3A' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "80px",
        }}
      />

      {/* Logo RMB */}
      <div className="relative z-10 flex items-center gap-2 mb-4">
        <img src="/images/logo-rmb.png" alt="RMB" className="h-10 w-auto" />
        <span className="text-text-secondary text-sm font-medium">Carte de Membre</span>
      </div>

      <div className="relative z-10 flex justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt="Photo" className="w-12 h-12 rounded-full border-2 border-primary/30 object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/30">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-text">{user.firstName} {user.lastName}</h2>
              <p className="text-text-secondary text-xs">#{memberNumber} · Niv. {user.level}</p>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="text-text-secondary text-xs space-y-0.5 mt-2">
            {user.dateOfBirth && <p className="flex items-center gap-1"><Calendar size={12} /> {new Date(user.dateOfBirth).toLocaleDateString("fr-FR")}</p>}
            {user.fonction && <p className="flex items-center gap-1"><Briefcase size={12} /> {user.fonction}</p>}
            {user.phone && <p className="flex items-center gap-1"><Phone size={12} /> {user.phone}</p>}
            {user.city && <p className="flex items-center gap-1"><MapPin size={12} /> Origine : {user.city}{user.village ? `, ${user.village}` : ""}{user.canton ? `, ${user.canton}` : ""}</p>}
            {user.currentCity && <p className="flex items-center gap-1"><MapPin size={12} /> Réside à : {user.currentCity}{user.currentVillage ? `, ${user.currentVillage}` : ""}{user.currentCountry ? ` · ${user.currentCountry}` : ""}</p>}
          </div>

          {/* Liens familiaux */}
          {parents.length > 0 && (
            <p className="text-text-secondary text-[11px] mt-1 leading-tight">
              {parents.length === 1 ? "Fils/Fille de" : "Enfant de"}{" "}
              {parents.map(p => `${p.firstName} ${p.lastName}`).join(" et ")}
            </p>
          )}
          {siblings.length > 0 && (
            <p className="text-text-secondary text-[11px] mt-0.5 leading-tight">
              Frère/Soeur de{" "}
              {siblings.slice(0, 2).map(s => `${s.firstName} ${s.lastName}`).join(", ")}
              {siblings.length > 2 && ` et ${siblings.length - 2} autres`}
            </p>
          )}

          <p className="text-text-secondary text-xs mt-1">
            Membre depuis {new Date(user.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 ml-2">
          <div className="bg-white dark:bg-gray-100 p-2 rounded-lg border border-border">
            <QRCodeSVG value={user.id} size={60} level="L" />
          </div>
          <button className="text-text-secondary hover:text-primary transition-colors">
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
    </div>
  );
});