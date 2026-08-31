import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  ArrowLeft,
  Braces,
  Check,
  Code2,
  Expand,
  Eye,
  FileCode2,
  Minimize2,
  Play,
  Save,
  ShieldCheck,
} from "lucide-react";
import { MiniAppFrame } from "./MiniAppFrame";
import type { MiniApp, MiniAppCode } from "./studio-core";

type EditorProps = {
  app: MiniApp;
  onBack: () => void;
  onSave: (app: MiniApp) => Promise<void>;
  onNotify: (message: string) => void;
};

type CodeTab = keyof MiniAppCode;

const tabDetails: Record<CodeTab, { label: string; short: string; icon: typeof Code2 }> = {
  html: { label: "HTML", short: "HTML", icon: FileCode2 },
  css: { label: "CSS", short: "CSS", icon: Braces },
  javascript: { label: "JavaScript", short: "JS", icon: Code2 },
};

function fingerprint(app: MiniApp): string {
  return JSON.stringify({
    name: app.name,
    description: app.description,
    category: app.category,
    icon: app.icon,
    accent: app.accent,
    code: app.code,
  });
}

function insertTab(event: ReactKeyboardEvent<HTMLTextAreaElement>, update: (value: string) => void) {
  if (event.key !== "Tab") return;
  event.preventDefault();
  const input = event.currentTarget;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const next = `${input.value.slice(0, start)}  ${input.value.slice(end)}`;
  update(next);
  requestAnimationFrame(() => {
    input.selectionStart = start + 2;
    input.selectionEnd = start + 2;
  });
}

export function Editor({ app, onBack, onSave, onNotify }: EditorProps) {
  const [draft, setDraft] = useState<MiniApp>(() => ({ ...app, code: { ...app.code } }));
  const [savedFingerprint, setSavedFingerprint] = useState(() => fingerprint(app));
  const [activeTab, setActiveTab] = useState<CodeTab>("html");
  const [previewApp, setPreviewApp] = useState<MiniApp>(() => ({ ...app, code: { ...app.code } }));
  const [previewVersion, setPreviewVersion] = useState(0);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"code" | "preview">("code");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dirty = useMemo(() => fingerprint(draft) !== savedFingerprint, [draft, savedFingerprint]);

  const save = useCallback(async () => {
    const name = draft.name.trim();
    if (!name) {
      onNotify("Gib deiner App zuerst einen Namen.");
      return;
    }
    setIsSaving(true);
    try {
      const saved: MiniApp = {
        ...draft,
        name,
        description: draft.description.trim(),
        category: draft.category.trim() || "Eigene App",
        trusted: true,
        updatedAt: Date.now(),
        code: { ...draft.code },
      };
      await onSave(saved);
      setDraft(saved);
      setSavedFingerprint(fingerprint(saved));
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1400);
    } finally {
      setIsSaving(false);
    }
  }, [draft, onNotify, onSave]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runPreview();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function runPreview() {
    setRuntimeError(null);
    setPreviewApp({ ...draft, name: draft.name.trim() || "Unbenannte App", code: { ...draft.code } });
    setPreviewVersion((value) => value + 1);
    setMobilePanel("preview");
  }

  function askToLeave() {
    if (dirty && !window.confirm("Ungespeicherte Änderungen verwerfen?")) return;
    onBack();
  }

  function updateField<K extends keyof MiniApp>(key: K, value: MiniApp[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateCode(key: CodeTab, value: string) {
    setDraft((current) => ({ ...current, code: { ...current.code, [key]: value } }));
  }

  const activeDetails = tabDetails[activeTab];
  const lineCount = draft.code[activeTab].split("\n").length;

  return (
    <section className="editor-screen" aria-label={`Editor für ${app.name}`}>
      <header className="editor-header">
        <button className="icon-button" type="button" onClick={askToLeave} aria-label="Editor schließen">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="editor-title-block">
          <span className="editor-kicker">MINI-APP EDITOR</span>
          <input
            className="editor-name"
            value={draft.name}
            onChange={(event) => updateField("name", event.target.value)}
            maxLength={44}
            aria-label="App-Name"
          />
        </div>
        <div className="editor-header-actions">
          <button className="button button-secondary editor-run-button" type="button" onClick={runPreview}>
            <Play aria-hidden="true" />
            Ausführen
          </button>
          <button className="button button-primary" type="button" onClick={() => void save()} disabled={isSaving || !dirty}>
            {justSaved ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}
            <span>{justSaved ? "Gespeichert" : isSaving ? "Speichert …" : "Speichern"}</span>
          </button>
        </div>
      </header>

      <div className="editor-mobile-switch" role="tablist" aria-label="Editoransicht">
        <button type="button" className={mobilePanel === "code" ? "active" : ""} onClick={() => setMobilePanel("code")}>
          <Code2 aria-hidden="true" /> Code
        </button>
        <button type="button" className={mobilePanel === "preview" ? "active" : ""} onClick={() => setMobilePanel("preview")}>
          <Eye aria-hidden="true" /> Vorschau
        </button>
      </div>

      <div className={`editor-workspace mobile-${mobilePanel}`}>
        <div className="code-panel">
          <div className="code-meta-form">
            <label>
              <span>Beschreibung</span>
              <input
                value={draft.description}
                onChange={(event) => updateField("description", event.target.value)}
                maxLength={120}
                placeholder="Was macht diese App?"
              />
            </label>
            <label>
              <span>Kategorie</span>
              <input
                value={draft.category}
                onChange={(event) => updateField("category", event.target.value)}
                maxLength={28}
                placeholder="Lernen"
              />
            </label>
            <label className="color-field">
              <span>Farbe</span>
              <input
                type="color"
                value={draft.accent}
                onChange={(event) => updateField("accent", event.target.value)}
                aria-label="App-Farbe"
              />
            </label>
          </div>

          <div className="code-tabs" role="tablist" aria-label="Programmiersprache">
            {(Object.keys(tabDetails) as CodeTab[]).map((tab) => {
              const details = tabDetails[tab];
              const TabIcon = details.icon;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={activeTab === tab ? "active" : ""}
                  onClick={() => {
                    setActiveTab(tab);
                    textareaRef.current?.focus();
                  }}
                >
                  <TabIcon aria-hidden="true" />
                  <span className="tab-long">{details.label}</span>
                  <span className="tab-short">{details.short}</span>
                </button>
              );
            })}
          </div>

          <div className="code-editor-wrap">
            <div className="code-toolbar">
              <span>{activeDetails.label}</span>
              <span>{lineCount} Zeilen</span>
            </div>
            <textarea
              ref={textareaRef}
              className="code-editor"
              value={draft.code[activeTab]}
              onChange={(event) => updateCode(activeTab, event.target.value)}
              onKeyDown={(event) => insertTab(event, (value) => updateCode(activeTab, value))}
              aria-label={`${activeDetails.label}-Code`}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="editor-security-note">
            <ShieldCheck aria-hidden="true" />
            <span>Die Vorschau läuft isoliert, offline und ohne Netzwerkzugriff.</span>
          </div>
        </div>

        <div className={`preview-panel ${fullscreenPreview ? "preview-fullscreen" : ""}`}>
          <div className="preview-toolbar">
            <div>
              <span className="status-dot" />
              <strong>Live-Vorschau</strong>
            </div>
            <div className="preview-toolbar-actions">
              <span className="preview-hint">⌘/Strg + Enter</span>
              <button
                className="icon-button icon-button-small"
                type="button"
                onClick={() => setFullscreenPreview((value) => !value)}
                aria-label={fullscreenPreview ? "Vorschau verkleinern" : "Vorschau vergrößern"}
              >
                {fullscreenPreview ? <Minimize2 aria-hidden="true" /> : <Expand aria-hidden="true" />}
              </button>
            </div>
          </div>
          {runtimeError && (
            <div className="runtime-error" role="alert">
              <strong>Codefehler</strong>
              <span>{runtimeError}</span>
            </div>
          )}
          <div className="preview-canvas">
            <MiniAppFrame
              key={`${previewApp.id}-${previewVersion}`}
              app={previewApp}
              title={`Vorschau: ${previewApp.name}`}
              persistent={false}
              onNotify={onNotify}
              onRuntimeError={setRuntimeError}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

