"use client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Mail, Phone } from "lucide-react";

export function ContactInfo() {
  const { data: config } = useQuery({
    queryKey: ["site-config"],
    queryFn: async () => {
      const res = await fetch("/api/site-config");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // cache 1h
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <MapPin className="text-primary mt-1" size={20} />
        <div>
          <p className="font-medium text-text">Adresse</p>
          <p className="text-text-secondary">{config?.contact_address || "Abidjan, Côte d'Ivoire"}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Mail className="text-primary mt-1" size={20} />
        <div>
          <p className="font-medium text-text">Email</p>
          <p className="text-text-secondary">{config?.contact_email || "contact@rmb-asso.org"}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Phone className="text-primary mt-1" size={20} />
        <div>
          <p className="font-medium text-text">Téléphone</p>
          <p className="text-text-secondary">{config?.contact_phone || "+225 00 00 00 00 00"}</p>
        </div>
      </div>
    </div>
  );
}
