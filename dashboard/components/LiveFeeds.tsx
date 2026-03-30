"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getWsUrl } from "@/lib/config";
import type { AlertPayload, WsMultiFrame } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

export default function LiveFeeds() {
  const [feeds, setFeeds] = useState<WsMultiFrame["cameras"]>([]);
  const [alert, setAlert] = useState<AlertPayload | null>(null);
  const [connected, setConnected] = useState(false);
  const lastAlertId = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };
    ws.onerror = () => setConnected(false);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as WsMultiFrame;
        if (data.type === "multi_frame" && Array.isArray(data.cameras)) {
          setFeeds(data.cameras);
          if (data.alert?.id && data.alert.id !== lastAlertId.current) {
            lastAlertId.current = data.alert.id;
            setAlert(data.alert);
            window.setTimeout(() => setAlert(null), 8000);
          }
        }
      } catch {
        /* ignore */
      }
    };

    return ws;
  }, []);

  useEffect(() => {
    const ws = connect();
    return () => {
      ws.close();
    };
  }, [connect]);

  return (
    <div className="space-y-4">
      {alert && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-red-100 shadow-lg shadow-red-900/20"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
              Alert
            </p>
            <p className="mt-1 text-sm">{alert.message}</p>
            <p className="mt-1 text-xs text-red-200/70">{alert.timestamp}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            connected ? "bg-emerald-500" : "bg-zinc-600"
          }`}
        />
        {connected ? "Stream connected" : "Reconnecting…"}
      </div>

      {feeds.length === 0 ? (
        <div className="flex aspect-video max-w-4xl items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-500">
          Waiting for video… (ensure backend is running and a camera is open)
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            feeds.length === 1
              ? "grid-cols-1"
              : feeds.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          }`}
        >
          {feeds.map((cam) => (
            <div
              key={cam.camera_id}
              className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2">
                <span className="text-sm font-medium text-zinc-200">
                  {cam.name}
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {cam.camera_id.slice(0, 8)}…
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${cam.data}`}
                alt={cam.name}
                className="aspect-video w-full object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
