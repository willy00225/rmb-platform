import { FamilyTreeVisual } from "./FamilyTreeVisual";

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface FamilyTreeProps {
  parents: FamilyMember[];
  children: FamilyMember[];
  spouses: FamilyMember[];
  siblings: FamilyMember[];
  currentUser: FamilyMember;
}

export function FamilyTree({ parents, children, spouses, siblings, currentUser }: FamilyTreeProps) {
  const hasData = parents.length > 0 || children.length > 0 || spouses.length > 0 || siblings.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Commencez à construire votre arbre généalogique.</p>
        <p className="text-text-secondary text-sm mt-2">Ajoutez vos parents, enfants, frères/soeurs et conjoints.</p>
      </div>
    );
  }

  return (
    <FamilyTreeVisual
      parents={parents}
      children={children}
      spouses={spouses}
      siblings={siblings}
      currentUser={currentUser}
    />
  );
}
