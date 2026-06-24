"use client";

export const dynamic = 'force-dynamic'; // Désactive le prérendu

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Bell, Mail, MessageCircle, Heart, Users, Calendar, AlertCircle } from "lucide-react";

// Type pour une notification
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications/list").then(res => res.json()),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Notifications
      </h1>

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
  );
}