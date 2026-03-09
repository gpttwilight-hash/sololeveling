"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  async function handleEnable() {
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Разрешение на уведомления отклонено");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("VAPID ключ не настроен");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (!res.ok) {
        setError("Не удалось сохранить подписку");
        return;
      }

      setEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-gray-500 font-mono">
        Push-уведомления не поддерживаются в этом браузере
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white font-medium">Напоминания о стрике</p>
          <p className="text-xs text-gray-500">Уведомление в 21:00 если квесты не выполнены</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={enabled ? undefined : handleEnable}
          disabled={loading || enabled}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            enabled
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          } disabled:opacity-50`}
        >
          {enabled ? "✓ Включены" : loading ? "..." : "Включить"}
        </motion.button>
      </div>
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
}
