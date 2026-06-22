"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withSlogan?: boolean;
  className?: string;
}

export function Logo({ size = "md", withSlogan = true, className = "" }: LogoProps) {
  const { data: config } = useQuery({
    queryKey: ["site-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/site-config");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // cache 1h
  });

  const logoSrc = config?.site_logo || "/images/logo-rmb.png";
  const sizes = {
    sm: "text-lg gap-1 h-6",
    md: "text-2xl gap-2 h-8",
    lg: "text-4xl gap-3 h-10",
  };

  return (
    <Link href="/" className={`inline-flex items-center ${sizes[size]} font-display font-bold ${className}`}>
      <img src={logoSrc} alt="RMB" className="h-full w-auto" />
      {withSlogan && (
        <span className="font-sans font-normal text-text-secondary text-xs ml-2 hidden sm:inline">
          UNIS PAR NOS RACINES, ENGAGÉS POUR NOTRE AVENIR
        </span>
      )}
    </Link>
  );
}