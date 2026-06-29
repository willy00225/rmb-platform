"use client";
import { createContext, useContext, useState } from "react";

const NotificationsContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <NotificationsContext.Provider value={{ open, setOpen }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider");
  return context;
}