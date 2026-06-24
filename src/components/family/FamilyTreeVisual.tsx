"use client";
import { useState } from "react";
import Link from "next/link";
import { User, ChevronDown, ChevronUp } from "lucide-react";

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface FamilyTreeVisualProps {
  parents: FamilyMember[];
  children: FamilyMember[];
  spouses: FamilyMember[];
  siblings: FamilyMember[];
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

export function FamilyTreeVisual({
  parents,
  children,
  spouses,
  siblings,
  currentUser,
}: FamilyTreeVisualProps) {
  const [expanded, setExpanded] = useState(true);

  // Calculer les positions pour le SVG
  const nodeWidth = 120;
  const nodeHeight = 100;
  const horizontalGap = 40;
  const verticalGap = 120;

  // Niveau 0 : utilisateur courant (centre)
  const userX = 400;
  const userY = 300;

  // Niveau -1 : parents (au-dessus)
  const parentsStartX = userX - ((parents.length - 1) * (nodeWidth + horizontalGap)) / 2;
  const parentsY = userY - verticalGap;

  // Niveau 0 : conjoints (à gauche/droite)
  const spousesStartX = userX - ((spouses.length) * (nodeWidth + horizontalGap)) / 2;
  const spousesY = userY;

  // Niveau 0 : fratrie (à gauche/droite en dessous)
  const siblingsStartX = userX - ((siblings.length) * (nodeWidth + horizontalGap)) / 2;
  const siblingsY = userY + verticalGap / 2;

  // Niveau 1 : enfants (en dessous)
  const childrenStartX = userX - ((children.length - 1) * (nodeWidth + horizontalGap)) / 2;
  const childrenY = userY + verticalGap;

  const totalHeight = children.length > 0 ? childrenY + nodeHeight + 40 : siblingsY + nodeHeight + 40;
  const totalWidth = 800;

  if (!expanded) {
    return (
      <div className="text-center py-8">
        <button
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary-hover transition"
        >
          <ChevronDown size={20} />
          Afficher l'arbre généalogique
        </button>
      </div>
    );
  }

  const MemberNode = ({ member, x, y, label }: { member: FamilyMember; x: number; y: number; label?: string }) => (
    <g>
      {/* Ligne de connexion */}
      <line
        x1={userX}
        y1={userY + nodeHeight / 2}
        x2={x + nodeWidth / 2}
        y2={y + 20}
        stroke="#E5E7EB"
        strokeWidth="2"
      />
      {/* Rectangle de fond */}
      <rect
        x={x}
        y={y}
        width={nodeWidth}
        height={nodeHeight}
        rx="16"
        fill="white"
        stroke="#E5E7EB"
        strokeWidth="1.5"
        filter="url(#shadow)"
      />
      {/* Avatar ou initiale */}
      <foreignObject x={x + 10} y={y + 10} width={40} height={40}>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {member.avatar ? (
            <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={18} />
          )}
        </div>
      </foreignObject>
      {/* Nom */}
      <foreignObject x={x + 55} y={y + 10} width={55} height={40}>
        <div className="text-xs font-medium text-text leading-tight">
          {member.firstName} {member.lastName}
        </div>
      </foreignObject>
      {/* Label */}
      {label && (
        <foreignObject x={x + 10} y={y + 55} width={100} height={20}>
          <div className="text-[10px] text-text-secondary">{label}</div>
        </foreignObject>
      )}
      {/* Lien cliquable */}
      <Link href={`/dashboard/profile/${member.id}`} className="absolute inset-0">
        <rect x={x} y={y} width={nodeWidth} height={nodeHeight} fill="transparent" />
      </Link>
    </g>
  );

  return (
    <div className="relative overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-text">Arbre généalogique</h2>
        <button
          onClick={() => setExpanded(false)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text transition"
        >
          <ChevronUp size={16} />
          Réduire
        </button>
      </div>
      <div className="bg-gray-50 rounded-2xl p-4 overflow-x-auto">
        <svg
          width={totalWidth}
          height={totalHeight}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="mx-auto"
        >
          <defs>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.05" />
            </filter>
          </defs>

          {/* Nœud central (utilisateur) */}
          <g>
            <rect
              x={userX}
              y={userY}
              width={nodeWidth}
              height={nodeHeight}
              rx="16"
              fill="#005A3A"
              stroke="#005A3A"
              strokeWidth="2"
              filter="url(#shadow)"
            />
            <foreignObject x={userX + 10} y={userY + 10} width={40} height={40}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </div>
            </foreignObject>
            <foreignObject x={userX + 55} y={userY + 10} width={55} height={40}>
              <div className="text-xs font-bold text-white leading-tight">
                {currentUser.firstName} {currentUser.lastName}
              </div>
            </foreignObject>
            <foreignObject x={userX + 10} y={userY + 55} width={100} height={20}>
              <div className="text-[10px] text-white/80">Vous</div>
            </foreignObject>
          </g>

          {/* Parents */}
          {parents.map((parent, idx) => (
            <MemberNode
              key={parent.id}
              member={parent}
              x={parentsStartX + idx * (nodeWidth + horizontalGap)}
              y={parentsY}
              label="Parent"
            />
          ))}

          {/* Conjoints */}
          {spouses.map((spouse, idx) => (
            <MemberNode
              key={spouse.id}
              member={spouse}
              x={spousesStartX + idx * (nodeWidth + horizontalGap)}
              y={spousesY}
              label="Conjoint"
            />
          ))}

          {/* Fratrie */}
          {siblings.map((sibling, idx) => (
            <MemberNode
              key={sibling.id}
              member={sibling}
              x={siblingsStartX + idx * (nodeWidth + horizontalGap)}
              y={siblingsY}
              label="Frère/Soeur"
            />
          ))}

          {/* Enfants */}
          {children.map((child, idx) => (
            <MemberNode
              key={child.id}
              member={child}
              x={childrenStartX + idx * (nodeWidth + horizontalGap)}
              y={childrenY}
              label="Enfant"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
