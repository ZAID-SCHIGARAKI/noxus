import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { buildSandboxDocument, createId, type MiniApp } from "./studio-core";
import { loadAppData, putAppData } from "./studio-db";

type MiniAppFrameProps = {
  app: MiniApp;
  title: string;
  persistent?: boolean;
  onClose?: () => void;
  onNotify?: (message: string) => void;
  onRuntimeError?: (message: string) => void;
};

type BridgeMessage = {
  __miniStudio?: boolean;
  channel?: string;
  requestId?: string;
  action?: string;
  key?: unknown;
  value?: unknown;
  message?: unknown;
};

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const MAX_DATA_BYTES = 2_000_000;

function isValidKey(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120 && !FORBIDDEN_KEYS.has(value);
}

function ensureDataSize(values: Record<string, unknown>): void {
  const serialized = JSON.stringify(values);
  if (serialized.length > MAX_DATA_BYTES) {
    throw new Error("Diese Mini-App hat ihr lokales Speicherlimit von 2 MB erreicht.");
  }
}

export function MiniAppFrame({
  app,
  title,
  persistent = true,
  onClose,
  onNotify,
  onRuntimeError,
}: MiniAppFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const valuesRef = useRef<Record<string, unknown>>({});
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | null>(persistent ? null : {});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [channel] = useState(() => createId("channel"));

  useEffect(() => {
    if (!persistent) {
      valuesRef.current = {};
      setInitialValues({});
      return;
    }
    let cancelled = false;
    loadAppData(app.id)
      .then((values) => {
        if (cancelled) return;
        valuesRef.current = { ...values };
        setInitialValues(values);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "App-Daten konnten nicht geladen werden.";
        setLoadError(message);
      });
    return () => {
      cancelled = true;
    };
  }, [app.id, persistent]);

  const sourceDocument = useMemo(
    () => (initialValues ? buildSandboxDocument(app, channel, initialValues) : ""),
    [app, channel, initialValues],
  );

  useEffect(() => {
    async function receiveMessage(event: MessageEvent<BridgeMessage>) {
      const frameWindow = iframeRef.current?.contentWindow;
      const message = event.data;
      if (
        !frameWindow ||
        event.source !== frameWindow ||
        !message ||
        message.__miniStudio !== true ||
        message.channel !== channel
      ) {
        return;
      }

      const reply = (ok: boolean, value?: unknown, error?: string) => {
        if (!message.requestId) return;
        frameWindow.postMessage(
          {
            __miniStudio: true,
            channel,
            requestId: message.requestId,
            action: "response",
            ok,
            value,
            error,
          },
          "*",
        );
      };

      try {
        switch (message.action) {
          case "storage:set": {
            if (!isValidKey(message.key)) throw new Error("Ungültiger Speicherschlüssel.");
            const next = { ...valuesRef.current, [message.key]: message.value };
            ensureDataSize(next);
            valuesRef.current = next;
            if (persistent) await putAppData(app.id, next);
            reply(true, message.value);
            break;
          }
          case "storage:remove": {
            if (!isValidKey(message.key)) throw new Error("Ungültiger Speicherschlüssel.");
            const next = { ...valuesRef.current };
            delete next[message.key];
            valuesRef.current = next;
            if (persistent) await putAppData(app.id, next);
            reply(true);
            break;
          }
          case "storage:clear": {
            valuesRef.current = {};
            if (persistent) await putAppData(app.id, {});
            reply(true);
            break;
          }
          case "notify":
            onNotify?.(String(message.message ?? ""));
            break;
          case "close":
            onClose?.();
            break;
          case "runtime:error":
            onRuntimeError?.(String(message.message ?? "Unbekannter Laufzeitfehler"));
            break;
          default:
            break;
        }
      } catch (error: unknown) {
        const text = error instanceof Error ? error.message : "Lokaler Speicherfehler";
        reply(false, undefined, text);
        onRuntimeError?.(text);
      }
    }

    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
  }, [app.id, channel, onClose, onNotify, onRuntimeError, persistent]);

  if (loadError) {
    return (
      <div className="frame-state frame-state-error" role="alert">
        <strong>Die Mini-App konnte nicht geöffnet werden.</strong>
        <span>{loadError}</span>
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="frame-state" aria-live="polite">
        <LoaderCircle className="spin" aria-hidden="true" />
        <span>App wird vorbereitet …</span>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      className="mini-app-frame"
      title={title}
      srcDoc={sourceDocument}
      sandbox="allow-scripts allow-modals allow-downloads"
      referrerPolicy="no-referrer"
    />
  );
}
