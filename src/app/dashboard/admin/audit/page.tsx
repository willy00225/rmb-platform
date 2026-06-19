"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async (page: number, actionFilter: string, search: string) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (actionFilter) params.set("action", actionFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/audit?${params.toString()}`);
    if (!res.ok) throw new Error("Erreur de chargement");
    return res.json();
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminAudit", page, actionFilter, search],
    queryFn: () => fetchLogs(page, actionFilter, search),
    placeholderData: (previousData) => previousData,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const actionsList = [
    "USER_UPDATED",
    "DONATION_CONFIRMED",
    "DONATION_REJECTED",
    "SPOT_CREATED",
    "SPOT_ACTIVATED",
    "SPOT_DEACTIVATED",
    "REPORT_RESOLVED",
    "REPORT_DISMISSED",
    "CAMPAIGN_SENT",
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Journal d'audit</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white"
        >
          <option value="">Toutes les actions</option>
          {actionsList.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher (ID, admin)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <Button type="submit" variant="secondary" size="sm"><Search size={16} /></Button>
        </form>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-500" size={32} /></div>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 italic p-6">Aucun log trouvé.</p>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-left text-sm font-medium text-gray-400">Date</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Admin</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Action</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Entité</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Détails</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-white/5">
                  <td className="p-4 text-white">{new Date(log.createdAt).toLocaleString("fr-FR")}</td>
                  <td className="p-4 text-white">{log.admin.firstName} {log.admin.lastName}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-brand-500/20 text-brand-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{log.entityType} #{log.entityId}</td>
                  <td className="p-4 text-gray-400 text-sm">{log.details?.substring(0, 60)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          variant="secondary"
          size="sm"
        >
          <ChevronLeft size={16} /> Précédent
        </Button>
        <span className="text-gray-400">
          Page {page} / {totalPages}
        </span>
        <Button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
          variant="secondary"
          size="sm"
        >
          Suivant <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}