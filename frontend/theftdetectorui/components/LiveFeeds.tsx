"use client";

import { useEffect, useRef, useState } from "react";
import { getWsUrl } from "@/lib/config";
import type { AlertPayload, WsMultiFrame } from "@/lib/types";
import { AlertTriangle, Radio, SignalHigh, VideoOff } from "lucide-react";

export default function LiveFeeds() {
  const [feeds, setFeeds] = useState<WsMultiFrame["cameras"]>([]);
  const [alert, setAlert] = useState<AlertPayload | null>(null);
  const [connected, setConnected] = useState(false);
  const [hasReceivedFrame, setHasReceivedFrame] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Waiting for video stream...");
  const lastAlertId = useRef<string | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const closedByUnmountRef = useRef(false);

  useEffect(() => {
    closedByUnmountRef.current = false;
    let ws: WebSocket | null = null;

    const scheduleReconnect = () => {
      if (closedByUnmountRef.current) return;
      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delayMs = Math.min(1000 * 2 ** Math.min(attempt - 1, 4), 15000);
      setStatusMessage(`Stream disconnected. Reconnecting in ${Math.ceil(delayMs / 1000)}s...`);
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        connectSocket();
      }, delayMs);
    };

    const connectSocket = () => {
      ws = new WebSocket(getWsUrl());
      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setConnected(true);
        setStatusMessage("Stream connected.");
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closedByUnmountRef.current) scheduleReconnect();
      };
      ws.onerror = () => {
        setConnected(false);
        setStatusMessage("WebSocket error. Attempting reconnect...");
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as WsMultiFrame;
          if (data.type === "multi_frame" && Array.isArray(data.cameras)) {
            setFeeds(data.cameras);
            if (data.cameras.length > 0) {
              setHasReceivedFrame(true);
              setStatusMessage("Stream connected.");
            } else {
              setStatusMessage("Socket connected, but no camera frames yet.");
            }
            if (data.alert?.id && data.alert.id !== lastAlertId.current) {
              lastAlertId.current = data.alert.id;
              setAlert(data.alert);
              window.setTimeout(() => setAlert(null), 8000);
            }
          }
        } catch {}
      };
    };

    connectSocket();
    return () => {
      closedByUnmountRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      ws?.close();
    };
  }, []);

  return (
    <div className="space-y-4">
      {alert && (
        <div className="flex items-start gap-3 rounded-2xl border border-[rgb(255,77,0)]/30 bg-[rgb(255,77,0)]/[0.08] px-4 py-4 backdrop-blur-xl" role="alert">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(255,77,0)]/15 ring-1 ring-[rgb(255,77,0)]/30">
            <AlertTriangle className="h-5 w-5 text-[rgb(255,77,0)]" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[rgb(255,77,0)]">Theft Alert</p>
            <p className="mt-0.5 text-sm text-foreground">{alert.message}</p>
            <p className="mt-1 text-xs text-muted">{alert.timestamp}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(0,255,190)] opacity-50" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${connected ? "bg-[rgb(0,255,190)] shadow-[0_0_8px_rgba(0,255,190,0.7)]" : "bg-muted/40"}`} />
          </span>
          <span className="text-xs font-medium text-foreground">{statusMessage}</span>
        </div>
        <div className="flex w-full items-center gap-1.5 text-xs text-muted sm:w-auto">
          {connected ? <SignalHigh className="h-3.5 w-3.5 text-[rgb(0,255,190)]" /> : <Radio className="h-3.5 w-3.5" />}
          {feeds.length > 0 && `${feeds.length} camera${feeds.length !== 1 ? "s" : ""}`}
        </div>
      </div>
      {feeds.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] text-muted">
          <VideoOff className="h-8 w-8 opacity-30" />
          {hasReceivedFrame && connected ? <p className="text-sm">No cameras detected</p> : <p className="text-sm">{statusMessage}</p>}
        </div>
      ) : (
        <div className={`grid gap-4 ${feeds.length === 1 ? "grid-cols-1" : feeds.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
          {feeds.map((cam) => (
            <div key={cam.camera_id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:border-white/[0.14]">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/30 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[rgb(0,255,190)] shadow-[0_0_6px_rgba(0,255,190,0.7)]" />
                  <span className="text-sm font-medium text-foreground">{cam.name}</span>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`data:image/jpeg;base64,${cam.data}`} alt={cam.name} className="aspect-video w-full object-contain" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
