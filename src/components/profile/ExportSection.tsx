"use client";
import { useRef } from "react";
import { MemberCard } from "@/components/dashboard/MemberCard";
import { ExportPDFButton } from "@/components/ui/ExportPDFButton";

// Extraction des types des props de MemberCard
type MemberCardProps = React.ComponentProps<typeof MemberCard>;
type MemberCardUser = MemberCardProps['user'];
type MemberCardParents = MemberCardProps['parents'];
type MemberCardSiblings = MemberCardProps['siblings'];

interface ExportSectionProps {
  memberCardUser: MemberCardUser;
  familyData: {
    parents: MemberCardParents;
    siblings: MemberCardSiblings;
  };
}

export function ExportSection({ memberCardUser, familyData }: ExportSectionProps) {
  // useRef<HTMLDivElement> crée un MutableRefObject, mais ExportPDFButton attend un RefObject.
  // On conserve l'assertion pour compatibilité.
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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