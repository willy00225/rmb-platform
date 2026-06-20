"use client";
import { useRef } from "react";
import { MemberCard } from "@/components/dashboard/MemberCard";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";

interface ExportSectionProps {
  memberCardUser: any; // ajustez le type selon vos besoins
  familyData: { parents: any[]; siblings: any[] };
}

export function ExportSection({ memberCardUser, familyData }: ExportSectionProps) {
  // Déclaration avec le type explicite pour éviter l'erreur
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {/* Assertion de type pour correspondre à l'interface attendue */}
        <ExportPDFButton cardRef={cardRef as React.RefObject<HTMLDivElement>} />
      </div>
      <MemberCard
        ref={cardRef}
        user={memberCardUser}
        parents={familyData.parents}
        siblings={familyData.siblings}
      />
    </div>
  );
}