import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  AppWindow,
  ArrowLeft,
  BookOpen,
  Braces,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CloudOff,
  Code2,
  Copy,
  Database,
  Download,
  Ellipsis,
  FileJson,
  FolderOpen,
  Grid2X2,
  HardDrive,
  Heart,
  Home,
  Import,
  Info,
  LayoutGrid,
  Monitor,
  Moon,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  X,
  type LucideProps,
} from "lucide-react";
import { Editor } from "./Editor";
import { MiniAppFrame } from "./MiniAppFrame";
import {
  APP_TEMPLATES,
  cloneMiniApp,
  createAppFromTemplate,
  DEFAULT_SETTINGS,
  parseStudioBackup,
  type MiniApp,
  type StudioSettings,
  type StudioTheme,
} from "./studio-core";
import {
  createBackup,
  estimateStorage,
  importBackup,
  loadApps,
  loadSettings,
  putApp,
  putSettings,
  removeApp,
  resetStudio,
} from "./studio-db";

type View = "library" | "create" | "data" | "settings";
type AppFilter = "all" | "favorites" | "Lernen" | "Alltag";
type IconComponent = (props: LucideProps) => ReactNode;

const iconMap: Record<string, IconComponent> = {
  cards: BookOpen,
  quiz: CircleHelp,
  check: CheckCircle2,
  code: Code2,
};

function Glyph({ name, ...props }: { name: string } & LucideProps) {
  const Icon = iconMap[name] ?? AppWindow;
  return <Icon {...props} />;
}

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`logo-mark ${small ? "logo-mark-small" : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <Sparkles />
    </span>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

function relativeTime(timestamp: number | null): string {
  if (!timestamp) return "Noch nicht geöffnet";
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "Gerade eben";
  if (minutes < 60) return `Vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Gestern";
  if (days < 7) return `Vor ${days} Tagen`;
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" }).format(timestamp);
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AppCard({
  app,
  compact,
  onOpen,
  onEdit,
  onFavorite,
  onDuplicate,
  onDelete,
}: {
  app: MiniApp;
  compact: boolean;
  onOpen: (app: MiniApp) => void;
  onEdit: (app: MiniApp) => void;
  onFavorite: (app: MiniApp) => void;
  onDuplicate: (app: MiniApp) => void;
  onDelete: (app: MiniApp) => void;
}) {
  const style = { "--app-accent": app.accent } as CSSProperties;
  return (
    <article className={`app-card ${compact ? "app-card-compact" : ""}`} style={style}>
      <div className="app-card-top">
        <button className="app-icon" type="button" onClick={() => onOpen(app)} aria-label={`${app.name} öffnen`}>
          <Glyph name={app.icon} aria-hidden="true" />
        </button>
        <div className="app-card-actions">
          <button
            className={`favorite-button ${app.favorite ? "active" : ""}`}
            type="button"
            onClick={() => onFavorite(app)}
            aria-label={app.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <Heart fill={app.favorite ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          <details className="card-menu">
            <summary aria-label="App-Menü">
              <Ellipsis aria-hidden="true" />
            </summary>
            <div className="card-menu-popover">
              <button type="button" onClick={() => onEdit(app)}><Pencil aria-hidden="true" /> Bearbeiten</button>
              <button type="button" onClick={() => onDuplicate(app)}><Copy aria-hidden="true" /> Duplizieren</button>
              <button className="danger" type="button" onClick={() => onDelete(app)}><Trash2 aria-hidden="true" /> Löschen</button>
            </div>
          </details>
        </div>
      </div>
      <button className="app-card-main" type="button" onClick={() => onOpen(app)}>
        <span className="app-category">{app.category}</span>
        <strong>{app.name}</strong>
        <p>{app.description || "Eigene Mini-App"}</p>
      </button>
      <div className="app-card-footer">
        <span>{relativeTime(app.lastOpenedAt)}</span>
        <button type="button" onClick={() => onOpen(app)} aria-label={`${app.name} starten`}>
          <Play fill="currentColor" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function LibraryView({
  apps,
  settings,
  online,
  onCreate,
  onOpen,
  onEdit,
  onFavorite,
  onDuplicate,
  onDelete,
}: {
  apps: MiniApp[];
  settings: StudioSettings;
  online: boolean;
  onCreate: () => void;
  onOpen: (app: MiniApp) => void;
  onEdit: (app: MiniApp) => void;
  onFavorite: (app: MiniApp) => void;
  onDuplicate: (app: MiniApp) => void;
  onDelete: (app: MiniApp) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AppFilter>("all");

  const filteredApps = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("de");
    return apps.filter((app) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "favorites" && app.favorite) ||
        app.category === filter;
      const matchesSearch = !query || `${app.name} ${app.description} ${app.category}`.toLocaleLowerCase("de").includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [apps, filter, search]);

  const recent = [...apps]
    .filter((app) => app.lastOpenedAt)
    .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))[0] ?? apps[0];

  return (
    <div className="page page-library">
      <section className="page-heading-row">
        <div>
          <span className="eyebrow">{getGreeting()}, Zaid</span>
          <h1>Dein Mini Studio</h1>
          <p>Alle Werkzeuge für Schule, Lernen und Alltag an einem Ort.</p>
        </div>
        <button className="button button-primary heading-create" type="button" onClick={onCreate}>
          <Plus aria-hidden="true" /> Neue App
        </button>
      </section>

      <section className="status-strip" aria-label="Studio-Status">
        <div><span className="status-icon"><Grid2X2 aria-hidden="true" /></span><strong>{apps.length}</strong><small>Mini-Apps</small></div>
        <div><span className="status-icon"><Heart aria-hidden="true" /></span><strong>{apps.filter((app) => app.favorite).length}</strong><small>Favoriten</small></div>
        <div><span className={`status-icon ${online ? "online" : "offline"}`}>{online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}</span><strong>{online ? "Online" : "Offline"}</strong><small>{online ? "Synchron bereit" : "Alles lokal"}</small></div>
      </section>

      {recent && settings.showTips && (
        <section className="resume-card" style={{ "--app-accent": recent.accent } as CSSProperties}>
          <div className="resume-glow" />
          <div className="resume-content">
            <span className="eyebrow">WEITERMACHEN</span>
            <h2>{recent.name}</h2>
            <p>{recent.description}</p>
            <button type="button" onClick={() => onOpen(recent)}><Play fill="currentColor" aria-hidden="true" /> Öffnen</button>
          </div>
          <div className="resume-symbol"><Glyph name={recent.icon} aria-hidden="true" /></div>
        </section>
      )}

      <section className="library-section">
        <div className="section-heading">
          <div><span className="eyebrow">BIBLIOTHEK</span><h2>Meine Apps</h2></div>
          <label className="search-field">
            <Search aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Apps durchsuchen" aria-label="Apps durchsuchen" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Suche löschen"><X aria-hidden="true" /></button>}
          </label>
        </div>
        <div className="filter-row" aria-label="App-Filter">
          {([
            ["all", "Alle"],
            ["favorites", "Favoriten"],
            ["Lernen", "Lernen"],
            ["Alltag", "Alltag"],
          ] as [AppFilter, string][]).map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>

        {filteredApps.length ? (
          <div className="app-grid">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                compact={settings.compactCards}
                onOpen={onOpen}
                onEdit={onEdit}
                onFavorite={onFavorite}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search aria-hidden="true" />
            <strong>Keine App gefunden</strong>
            <span>Ändere Suche oder Filter.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function CreateView({ onCreate }: { onCreate: (templateId: string) => void }) {
  return (
    <div className="page page-create">
      <section className="page-heading-row">
        <div>
          <span className="eyebrow">APP-WERKSTATT</span>
          <h1>Was willst du bauen?</h1>
          <p>Wähle eine Vorlage und ersetze anschließend Inhalt, Design und Logik.</p>
        </div>
      </section>

      <section className="template-grid">
        {APP_TEMPLATES.map((template, index) => (
          <button
            key={template.id}
            className={`template-card template-${index}`}
            style={{ "--app-accent": template.accent } as CSSProperties}
            type="button"
            onClick={() => onCreate(template.id)}
          >
            <span className="template-icon"><Glyph name={template.icon} aria-hidden="true" /></span>
            <span className="template-copy"><small>{template.category}</small><strong>{template.name}</strong><p>{template.description}</p></span>
            <span className="template-arrow"><ChevronRight aria-hidden="true" /></span>
          </button>
        ))}
      </section>

      <section className="builder-explainer">
        <div className="explainer-heading">
          <span className="explainer-icon"><Braces aria-hidden="true" /></span>
          <div><span className="eyebrow">SO FUNKTIONIERT ES</span><h2>Drei Sprachen, eine App</h2></div>
        </div>
        <div className="language-flow">
          <div><span>01</span><strong>HTML</strong><p>Inhalt und Aufbau</p></div>
          <ChevronRight aria-hidden="true" />
          <div><span>02</span><strong>CSS</strong><p>Design und Animation</p></div>
          <ChevronRight aria-hidden="true" />
          <div><span>03</span><strong>JavaScript</strong><p>Logik und Speicherung</p></div>
        </div>
        <div className="api-note">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Dauerhaft lokal speichern</strong>
            <code>await MiniOS.storage.set(&quot;fortschritt&quot;, wert)</code>
          </div>
        </div>
      </section>
    </div>
  );
}

function DataView({
  apps,
  storage,
  installed,
  onExport,
  onImport,
  onReset,
}: {
  apps: MiniApp[];
  storage: { usage: number; quota: number } | null;
  installed: boolean;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="page page-data">
      <section className="page-heading-row">
        <div><span className="eyebrow">DATEN & INSTALLATION</span><h1>Dein Studio gehört dir.</h1><p>Alle Inhalte liegen lokal auf deinem Gerät. Eine Sicherung schützt sie zusätzlich.</p></div>
      </section>

      <section className="data-grid">
        <article className="data-card backup-card">
          <span className="data-icon"><Save aria-hidden="true" /></span>
          <div><span className="eyebrow">SICHERUNG</span><h2>Apps exportieren</h2><p>Speichert Code, Einstellungen und Fortschritt in einer einzigen JSON-Datei.</p></div>
          <div className="data-card-actions">
            <button className="button button-primary" type="button" onClick={onExport}><Download aria-hidden="true" /> Backup laden</button>
            <button className="button button-secondary" type="button" onClick={() => fileRef.current?.click()}><Upload aria-hidden="true" /> Importieren</button>
            <input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={onImport} />
          </div>
        </article>

        <article className="data-card storage-card">
          <span className="data-icon"><HardDrive aria-hidden="true" /></span>
          <div><span className="eyebrow">LOKALER SPEICHER</span><h2>{formatBytes(storage?.usage ?? 0)} belegt</h2><p>{apps.length} Apps inklusive ihrer Fortschritte sind auf diesem Gerät gespeichert.</p></div>
          <div className="storage-meter"><span style={{ width: `${storage?.quota ? Math.max(1, Math.min(100, ((storage.usage / storage.quota) * 100))) : 1}%` }} /></div>
          <small>Verfügbares Browser-Limit: {storage ? formatBytes(storage.quota) : "wird ermittelt"}</small>
        </article>
      </section>

      <section className="install-card">
        <div className="install-visual"><Smartphone aria-hidden="true" /><span className={installed ? "installed" : ""}>{installed ? <CheckCircle2 aria-hidden="true" /> : <Plus aria-hidden="true" />}</span></div>
        <div className="install-copy">
          <span className="eyebrow">{installed ? "INSTALLIERT" : "IPHONE-INSTALLATION"}</span>
          <h2>{installed ? "Mini Studio läuft als App" : "In 30 Sekunden auf dem Home-Bildschirm"}</h2>
          <ol>
            <li><span>1</span><p>Diese Seite auf dem iPhone in <strong>Safari</strong> öffnen.</p></li>
            <li><span>2</span><p>Auf <strong>Teilen</strong> und dann „Zum Home-Bildschirm“ tippen.</p></li>
            <li><span>3</span><p>„Als Web-App öffnen“ aktivieren und <strong>Hinzufügen</strong>.</p></li>
          </ol>
          <div className="offline-badge"><CloudOff aria-hidden="true" /> Nach dem ersten Laden vollständig offline nutzbar</div>
        </div>
      </section>

      <section className="danger-zone">
        <div><strong>Studio zurücksetzen</strong><span>Löscht alle eigenen Apps und stellt die drei Vorlagen wieder her.</span></div>
        <button className="button button-danger-outline" type="button" onClick={onReset}><RotateCcw aria-hidden="true" /> Zurücksetzen</button>
      </section>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="setting-row">
      <span><strong>{label}</strong><small>{description}</small></span>
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function SettingsView({ settings, onChange }: { settings: StudioSettings; onChange: (settings: StudioSettings) => void }) {
  const themes: { value: StudioTheme; label: string; icon: IconComponent }[] = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Hell", icon: Sun },
    { value: "dark", label: "Dunkel", icon: Moon },
  ];
  return (
    <div className="page page-settings">
      <section className="page-heading-row"><div><span className="eyebrow">EINSTELLUNGEN</span><h1>Dein Look. Dein Workflow.</h1><p>Die Einstellungen bleiben auf diesem Gerät gespeichert.</p></div></section>
      <section className="settings-card">
        <div className="settings-group">
          <div className="settings-group-title"><span><Sun aria-hidden="true" /></span><div><strong>Erscheinungsbild</strong><small>Farbschema der Studio-Oberfläche</small></div></div>
          <div className="theme-segment">
            {themes.map((theme) => {
              const Icon = theme.icon;
              return <button key={theme.value} type="button" className={settings.theme === theme.value ? "active" : ""} onClick={() => onChange({ ...settings, theme: theme.value })}><Icon aria-hidden="true" />{theme.label}</button>;
            })}
          </div>
        </div>
        <div className="settings-divider" />
        <div className="settings-group">
          <div className="settings-group-title"><span><LayoutGrid aria-hidden="true" /></span><div><strong>Bibliothek</strong><small>Darstellung deiner Mini-Apps</small></div></div>
          <SettingToggle label="Kompakte Karten" description="Zeigt mehr Apps gleichzeitig." checked={settings.compactCards} onChange={(value) => onChange({ ...settings, compactCards: value })} />
          <SettingToggle label="Weitermachen-Karte" description="Zeigt die zuletzt verwendete App oben an." checked={settings.showTips} onChange={(value) => onChange({ ...settings, showTips: value })} />
        </div>
      </section>

      <section className="language-support-card">
        <div className="settings-group-title"><span><Code2 aria-hidden="true" /></span><div><strong>Programmiersprachen</strong><small>Was auf dem iPhone wirklich direkt läuft</small></div></div>
        <div className="support-list">
          <div className="supported"><CheckCircle2 aria-hidden="true" /><span><strong>HTML, CSS, JavaScript</strong><small>Voll ausführbar, schnell und offline.</small></span></div>
          <div><Info aria-hidden="true" /><span><strong>Python, Java, C++, Swift, PHP</strong><small>Können nicht nativ in dieser iPhone-Web-App laufen. Dafür wären große zusätzliche Laufzeitumgebungen nötig.</small></span></div>
        </div>
      </section>

      <section className="about-card">
        <LogoMark />
        <div><strong>Zaid Mini Studio</strong><span>Version 1.0 · Offline PWA</span></div>
        <ShieldCheck aria-label="Sicher isolierte Code-Ausführung" />
      </section>
    </div>
  );
}

function Runner({
  app,
  onClose,
  onEdit,
  onNotify,
}: {
  app: MiniApp;
  onClose: () => void;
  onEdit: () => void;
  onNotify: (message: string) => void;
}) {
  const [reload, setReload] = useState(0);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  return (
    <section className="runner-screen" style={{ "--app-accent": app.accent } as CSSProperties}>
      <header className="runner-header">
        <button className="icon-button" type="button" onClick={onClose} aria-label="App schließen"><ArrowLeft aria-hidden="true" /></button>
        <div className="runner-title"><span className="runner-icon"><Glyph name={app.icon} aria-hidden="true" /></span><div><strong>{app.name}</strong><small>{app.category}</small></div></div>
        <div className="runner-actions">
          <button className="icon-button" type="button" onClick={() => { setRuntimeError(null); setReload((value) => value + 1); }} aria-label="App neu laden"><RefreshCw aria-hidden="true" /></button>
          <button className="button button-secondary" type="button" onClick={onEdit}><Pencil aria-hidden="true" /><span>Bearbeiten</span></button>
        </div>
      </header>
      {runtimeError && <div className="runner-error" role="alert"><Code2 aria-hidden="true" /><span><strong>Fehler im App-Code</strong>{runtimeError}</span><button type="button" onClick={() => setRuntimeError(null)} aria-label="Fehler ausblenden"><X aria-hidden="true" /></button></div>}
      <div className="runner-frame-wrap">
        <MiniAppFrame
          key={`${app.id}-${reload}`}
          app={app}
          title={app.name}
          onClose={onClose}
          onNotify={onNotify}
          onRuntimeError={setRuntimeError}
        />
      </div>
    </section>
  );
}

const navigation: { value: View; label: string; icon: IconComponent }[] = [
  { value: "library", label: "Bibliothek", icon: Home },
  { value: "create", label: "Erstellen", icon: Plus },
  { value: "data", label: "Daten", icon: Database },
  { value: "settings", label: "Einstellungen", icon: Settings2 },
];

export default function App() {
  const [apps, setApps] = useState<MiniApp[]>([]);
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<View>("library");
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [runnerId, setRunnerId] = useState<string | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [installed, setInstalled] = useState(false);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const notify = useCallback((message: string) => {
    if (!message) return;
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const refreshStorage = useCallback(() => {
    void estimateStorage().then(setStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadApps(), loadSettings(), estimateStorage()])
      .then(([loadedApps, loadedSettings, storageEstimate]) => {
        if (cancelled) return;
        setApps(loadedApps);
        setSettings(loadedSettings);
        setStorage(storageEstimate);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFatalError(error instanceof Error ? error.message : "Das Studio konnte nicht gestartet werden.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolved = settings.theme === "system" ? (media.matches ? "dark" : "light") : settings.theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0b1020" : "#f2f5fb");
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [settings.theme]);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => {
      const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setInstalled(standaloneMedia.matches || iosStandalone);
    };
    updateInstalled();
    standaloneMedia.addEventListener("change", updateInstalled);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      standaloneMedia.removeEventListener("change", updateInstalled);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
      notify("Offline-Modus konnte noch nicht aktiviert werden. Lade die App einmal neu.");
    });
  }, [notify]);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const runnerApp = apps.find((app) => app.id === runnerId) ?? null;
  const editorApp = apps.find((app) => app.id === editorId) ?? null;

  async function saveApp(app: MiniApp) {
    await putApp(app);
    setApps((current) => [app, ...current.filter((item) => item.id !== app.id)].sort((a, b) => b.updatedAt - a.updatedAt));
    notify("App gespeichert.");
    refreshStorage();
  }

  async function openApp(app: MiniApp) {
    let target = app;
    if (!app.trusted) {
      const approved = window.confirm("Diese App wurde importiert. Führe nur Code aus, dessen Quelle du kennst. Trotzdem öffnen?");
      if (!approved) return;
      target = { ...app, trusted: true, updatedAt: Date.now() };
    }
    target = { ...target, lastOpenedAt: Date.now() };
    await putApp(target);
    setApps((current) => current.map((item) => (item.id === target.id ? target : item)));
    setRunnerId(target.id);
  }

  async function toggleFavorite(app: MiniApp) {
    const updated = { ...app, favorite: !app.favorite, updatedAt: Date.now() };
    await putApp(updated);
    setApps((current) => current.map((item) => (item.id === app.id ? updated : item)));
  }

  async function duplicateApp(app: MiniApp) {
    const copy = cloneMiniApp(app);
    await putApp(copy);
    setApps((current) => [copy, ...current]);
    notify("App dupliziert.");
    refreshStorage();
  }

  async function deleteApp(app: MiniApp) {
    if (!window.confirm(`„${app.name}“ samt gespeichertem Fortschritt löschen?`)) return;
    await removeApp(app.id);
    setApps((current) => current.filter((item) => item.id !== app.id));
    if (runnerId === app.id) setRunnerId(null);
    if (editorId === app.id) setEditorId(null);
    notify("App gelöscht.");
    refreshStorage();
  }

  async function createNewApp(templateId: string) {
    const app = createAppFromTemplate(templateId);
    await putApp(app);
    setApps((current) => [app, ...current]);
    setEditorId(app.id);
    refreshStorage();
  }

  async function changeSettings(next: StudioSettings) {
    setSettings(next);
    await putSettings(next);
  }

  async function exportAll() {
    const backup = await createBackup();
    const date = new Date().toISOString().slice(0, 10);
    downloadText(`zaid-mini-studio-backup-${date}.json`, JSON.stringify(backup, null, 2));
    notify("Backup erstellt.");
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const backup = parseStudioBackup(await file.text());
      if (!window.confirm(`Backup mit ${backup.apps.length} Apps importieren? Deine jetzigen Daten werden ersetzt.`)) return;
      await importBackup(backup);
      setApps(await loadApps());
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
      setView("library");
      notify("Backup erfolgreich importiert.");
      refreshStorage();
    } catch (error: unknown) {
      notify(error instanceof Error ? error.message : "Import fehlgeschlagen.");
    }
  }

  async function resetAll() {
    if (!window.confirm("Wirklich alle eigenen Apps und Fortschritte löschen? Dieser Schritt kann nur mit einem Backup rückgängig gemacht werden.")) return;
    await resetStudio();
    setApps(await loadApps());
    setSettings(DEFAULT_SETTINGS);
    setView("library");
    notify("Studio zurückgesetzt.");
    refreshStorage();
  }

  if (loading) {
    return <main className="startup-screen"><LogoMark /><strong>Mini Studio</strong><span>Deine Apps werden geladen …</span></main>;
  }

  if (fatalError) {
    return <main className="startup-screen startup-error"><CloudOff aria-hidden="true" /><strong>Start fehlgeschlagen</strong><span>{fatalError}</span><button className="button button-primary" type="button" onClick={() => location.reload()}><RefreshCw aria-hidden="true" /> Neu laden</button></main>;
  }

  if (editorApp) {
    return <><Editor app={editorApp} onBack={() => setEditorId(null)} onSave={saveApp} onNotify={notify} />{toast && <div className="toast" role="status">{toast}</div>}</>;
  }

  return (
    <div className="studio-shell">
      <aside className="desktop-sidebar">
        <div className="brand"><LogoMark /><span><strong>Mini Studio</strong><small>by Zaid</small></span></div>
        <nav aria-label="Hauptnavigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button key={item.value} type="button" className={view === item.value ? "active" : ""} onClick={() => setView(item.value)}><Icon aria-hidden="true" /><span>{item.label}</span>{view === item.value && <i />}</button>;
          })}
        </nav>
        <div className="sidebar-status"><span className={online ? "online" : "offline"}>{online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}</span><div><strong>{online ? "Verbunden" : "Offline bereit"}</strong><small>{online ? "Updates verfügbar" : "Daten bleiben lokal"}</small></div></div>
      </aside>

      <header className="mobile-header">
        <div className="brand"><LogoMark small /><span><strong>Mini Studio</strong><small>by Zaid</small></span></div>
        <button className="icon-button" type="button" onClick={() => setView("settings")} aria-label="Einstellungen"><Settings2 aria-hidden="true" /></button>
      </header>

      <main className="main-surface">
        {view === "library" && <LibraryView apps={apps} settings={settings} online={online} onCreate={() => setView("create")} onOpen={(app) => void openApp(app)} onEdit={(app) => setEditorId(app.id)} onFavorite={(app) => void toggleFavorite(app)} onDuplicate={(app) => void duplicateApp(app)} onDelete={(app) => void deleteApp(app)} />}
        {view === "create" && <CreateView onCreate={(templateId) => void createNewApp(templateId)} />}
        {view === "data" && <DataView apps={apps} storage={storage} installed={installed} onExport={() => void exportAll()} onImport={(event) => void importFile(event)} onReset={() => void resetAll()} />}
        {view === "settings" && <SettingsView settings={settings} onChange={(next) => void changeSettings(next)} />}
      </main>

      <nav className="mobile-nav" aria-label="Hauptnavigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          return <button key={item.value} type="button" className={view === item.value ? "active" : ""} onClick={() => setView(item.value)}><Icon aria-hidden="true" /><span>{item.label}</span></button>;
        })}
      </nav>

      {runnerApp && <Runner app={runnerApp} onClose={() => setRunnerId(null)} onEdit={() => { setRunnerId(null); setEditorId(runnerApp.id); }} onNotify={notify} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
