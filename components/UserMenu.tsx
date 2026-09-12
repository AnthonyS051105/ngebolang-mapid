"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { AppShellUser } from "./AppShell";

interface UserMenuProps {
  user: AppShellUser;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/masuk");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const initial = user.namaTampilan.charAt(0).toUpperCase() || "?";

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="avatar"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu akun"
        aria-expanded={open}
      >
        {initial}
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-info">
            <div className="user-menu-name">{user.namaTampilan}</div>
            <div className="user-menu-email">{user.email}</div>
          </div>
          <button
            type="button"
            className="user-menu-item"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut width={15} height={15} />
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      )}
    </div>
  );
}
