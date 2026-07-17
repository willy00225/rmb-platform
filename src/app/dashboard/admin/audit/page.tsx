"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  FileText,
  Clock,
  User,
  Tag,
  Info,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  admin: { firstName: string; lastName: string };
  details: string;
  createdAt: string;
}

const ACTIONS_LIST = [
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

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async (page: number, actionFilter: string, search: string) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (actionFilter) params.set("action", actionFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/audit?${params.toString()}`);
    if (!res.ok) throw new Error("Erreur de chargement");
    return res.json();
  };

  const { data, isLoading, isError } = useQuery<{
    logs: AuditLog[];
    totalPages: number;
  }>({
    queryKey: ["adminAudit", page, actionFilter, search],
    queryFn: () => fetchLogs(page, actionFilter, search),
    placeholderData: (prev) => prev,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  const clearFilters = () => {
    setActionFilter("");
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = actionFilter || search;

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <FileText size={28} className="text-primary" />
            Journal d&apos;audit
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Consultez l&apos;historique des actions des administrateurs
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card-premium p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Rechercher par ID, admin, ou détail..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <Filter size={16} className="mr-1" />
              Filtrer par action
              {actionFilter && (
                <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-red-500"
              >
                <X size={16} className="mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border dark:border-white/10">
                <button
                  onClick={() => {
                    setActionFilter("");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    !actionFilter
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  Toutes les actions
                </button>
                {ACTIONS_LIST.map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      setActionFilter(action);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      actionFilter === action
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {action.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Résumé */}
      {logs.length > 0 && (
        <p className="text-sm text-text-secondary">
          {logs.length} résultat{logs.length > 1 ? "s" : ""} affiché
          {logs.length > 1 ? "s" : ""}
          {totalPages > 1 && ` – Page ${page} sur ${totalPages}`}
        </p>
      )}

      {/* Tableau (ou carte sur mobile) */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-secondary animate-pulse">
            Chargement du journal...
          </p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">
          Erreur lors du chargement. Veuillez réessayer.
        </div>
      ) : logs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText size={36} className="text-primary opacity-70" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            Aucun log trouvé
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            {hasActiveFilters
              ? "Aucune entrée ne correspond à vos critères de recherche. Essayez de modifier ou réinitialiser les filtres."
              : "Aucune action d'administration enregistrée pour le moment."}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Version desktop : tableau */}
          <div className="hidden md:block card-premium overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-white/10 bg-gray-50 dark:bg-white/5">
                  <th className="p-4 text-left text-sm font-semibold text-text">
                    <Clock size={14} className="inline mr-1" /> Date
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-text">
                    <User size={14} className="inline mr-1" /> Admin
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-text">
                    <Tag size={14} className="inline mr-1" /> Action
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-text">
                    Entité
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-text">
                    <Info size={14} className="inline mr-1" /> Détails
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                  >
                    <td className="p-4 text-text text-sm whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-text font-medium">
                      {log.admin.firstName} {log.admin.lastName}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary text-sm">
                      {log.entityType} #{log.entityId.substring(0, 8)}
                    </td>
                    <td className="p-4 text-text-secondary text-sm max-w-[200px] truncate">
                      {log.details || "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version mobile : cartes */}
          <div className="md:hidden space-y-4">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="card-premium p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    {new Date(log.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                    {log.action.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-text font-medium">
                  {log.admin.firstName} {log.admin.lastName}
                </p>
                <p className="text-text-secondary text-sm">
                  {log.entityType} #{log.entityId.substring(0, 8)}
                </p>
                {log.details && (
                  <p className="text-text-secondary text-xs truncate">
                    {log.details}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
            size="sm"
          >
            <ChevronLeft size={16} className="mr-1" /> Précédent
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                  p === page
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            variant="secondary"
            size="sm"
          >
            Suivant <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}