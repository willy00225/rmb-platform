"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import Link from "next/link";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(query)}`).then(res => res.json()),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    setOpen(query.length >= 2);
  }, [query]);

  const handleSelect = () => {
    setOpen(false);
    setQuery("");
  };

  const hasResults =
    data?.users?.length || data?.posts?.length || data?.groups?.length || data?.products?.length;

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-border">
        <Search size={18} className="text-text-secondary" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-text placeholder-text-secondary focus:outline-none text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="text-text-secondary hover:text-text">
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full rounded-xl bg-white dark:bg-surface border border-border shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-text-secondary text-sm">Recherche...</div>
          )}
          {!isLoading && !hasResults && (
            <div className="p-4 text-center text-text-secondary text-sm">Aucun résultat.</div>
          )}
          {data?.users?.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Membres</p>
              {data.users.map((u: any) => (
                <Link key={u.id} href={`/dashboard/profile/${u.id}`} onClick={handleSelect} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <span className="text-text text-sm">{u.firstName} {u.lastName}</span>
                </Link>
              ))}
            </div>
          )}
          {data?.posts?.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Publications</p>
              {data.posts.map((p: any) => (
                <p key={p.id} className="p-2 text-sm text-text line-clamp-1">{p.content}</p>
              ))}
            </div>
          )}
          {data?.groups?.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Groupes</p>
              {data.groups.map((g: any) => (
                <Link key={g.id} href={`/dashboard/groups/${g.id}`} onClick={handleSelect} className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm text-text">{g.name}</Link>
              ))}
            </div>
          )}
          {data?.products?.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Marketplace</p>
              {data.products.map((p: any) => (
                <Link key={p.id} href={`/dashboard/marketplace/${p.id}`} onClick={handleSelect} className="flex justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm text-text">
                  <span>{p.title}</span>
                  <span className="text-primary font-medium">{p.price} FCFA</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}