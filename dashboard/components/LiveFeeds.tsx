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
          className="flex items-start gap-3 rounded-fidelity border border-tertiary/40 bg-tertiary/10 px-4 py-3 text-foreground shadow-lg shadow-tertiary/10"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-tertiary" />
          <div>
            <p className="font-label text-sm font-semibold uppercase tracking-wide text-tertiary">
              Alert
            </p>
            <p className="mt-1 text-sm">{alert.message}</p>
            <p className="mt-1 text-xs text-muted">{alert.timestamp}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            connected ? "bg-primary" : "bg-neutral"
          }`}
        />
        {connected ? "Stream connected" : "Reconnecting…"}
      </div>

      {feeds.length === 0 ? (
        <div className="flex aspect-video max-w-4xl items-center justify-center rounded-fidelity border border-dashed border-border bg-surface/50 text-muted">
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
              className="overflow-hidden rounded-fidelity border border-border bg-surface shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
                <span className="text-sm font-medium text-foreground">
                  {cam.name}
                </span>
                <span className="font-mono text-[10px] text-muted">
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
