"use client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, MessageCircle, Heart, Users, Calendar, Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications/list").then(res => res.json()),
    enabled: open,
    refetchInterval: 30000,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-surface shadow-2xl border-l border-border dark:border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-white/10">
              <h2 className="text-lg font-semibold text-text dark:text-white">Notifications</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell size={48} className="mx-auto text-text-secondary dark:text-gray-500 mb-4" />
                  <p className="text-text-secondary italic">Aucune notification pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border ${
                        notif.isRead
                          ? "bg-white dark:bg-surface border-border dark:border-white/10"
                          : "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10">
                          {notif.type === "message" && <MessageCircle size={18} className="text-blue-500" />}
                          {notif.type === "like" && <Heart size={18} className="text-red-500" />}
                          {notif.type === "friend" && <Users size={18} className="text-green-500" />}
                          {notif.type === "event" && <Calendar size={18} className="text-purple-500" />}
                          {!["message", "like", "friend", "event"].includes(notif.type) && (
                            <Bell size={18} className="text-text-secondary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-text dark:text-white font-medium">{notif.title}</p>
                          <p className="text-sm text-text-secondary dark:text-gray-400">{notif.body}</p>
                          <p className="text-xs text-text-secondary dark:text-gray-500 mt-1">
                            {new Date(notif.createdAt).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}