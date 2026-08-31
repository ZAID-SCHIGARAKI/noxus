# Zaid Mini Studio

Eine installierbare Offline-App für dein iPhone. Du kannst darin eigene kleine Apps aus HTML, CSS und JavaScript erstellen, starten und dauerhaft lokal speichern.

## Was bereits eingebaut ist

- Apple-artige Oberfläche für PC und iPhone
- Bibliothek, Suche, Kategorien, Favoriten und Duplizieren
- Editor für HTML, CSS und JavaScript mit sicherer Live-Vorschau
- Vorlagen: Karteikarten, Quiz, Checkliste und leere App
- lokaler Fortschritt über `MiniOS.storage`
- Import und Export aller Apps als Backup
- Offline-Modus, App-Symbol und Vollbildstart
- automatische kostenlose Veröffentlichung über GitHub Pages

## 1. Am PC testen

Installiere [Node.js LTS](https://nodejs.org/) und entpacke diesen Ordner. Öffne ihn in VS Code und führe im Terminal aus:

```bash
npm install
npm run dev
```

Öffne die angezeigte Adresse im Browser. Mit `Strg + S` speicherst du im Editor; mit `Strg + Enter` startest du die Vorschau.

## 2. Kostenlos auf GitHub hochladen

1. Erstelle auf [github.com/new](https://github.com/new) ein **öffentliches** Repository, zum Beispiel `zaid-mini-studio`.
2. Öffne das Repository und wähle **Add file → Upload files**.
3. Ziehe **den Inhalt dieses Ordners** hinein, einschließlich `.github`, und bestätige mit **Commit changes**.
4. Öffne **Settings → Pages** und wähle bei **Source** den Eintrag **GitHub Actions**.
5. Öffne den Tab **Actions**. Nach dem grünen Haken steht deine App unter `https://DEIN-NAME.github.io/zaid-mini-studio/` bereit.

Falls der erste automatische Lauf vor dem Aktivieren von Pages rot wurde, öffne ihn und wähle **Re-run all jobs**.

Persönliche Apps und Lernstände werden nicht zu GitHub hochgeladen. Sie entstehen erst in deinem Browser und bleiben auf deinem Gerät.

## 3. Auf dem iPhone als App installieren

1. Öffne die GitHub-Pages-Adresse in **Safari** und warte, bis die Startseite vollständig geladen ist.
2. Tippe auf **Teilen → Zum Home-Bildschirm**.
3. Aktiviere **Als Web-App öffnen** und tippe auf **Hinzufügen**.
4. Starte die App einmal. Danach funktioniert sie auch im Flugmodus.

Es gibt keine 7-Tage-Sperre und kein erneutes Signieren. Technisch ist es eine PWA: Sie sieht wie eine App aus, startet im Vollbild und arbeitet offline, nutzt aber den sicheren iPhone-Web-App-Unterbau.

## Eigene Mini-App programmieren

In Mini Studio auf **Erstellen → Leere App** tippen. Der Code wird in drei Bereiche geteilt:

- **HTML:** sichtbarer Inhalt
- **CSS:** Design
- **JavaScript:** Verhalten

Werte dauerhaft speichern:

```js
const score = await MiniOS.storage.get("score", 0);
await MiniOS.storage.set("score", score + 1);
```

Weitere Befehle:

```js
await MiniOS.storage.remove("score");
await MiniOS.storage.clear();
MiniOS.notify("Gespeichert!");
MiniOS.close();
```

Jede Mini-App besitzt ihren eigenen Speicher. Aus Sicherheitsgründen hat eingefügter Code keinen direkten Zugriff auf das Studio und standardmäßig keinen Netzwerkzugriff.

## Wichtige Grenze

Direkt ausführbar sind HTML, CSS und JavaScript. Python, Java, C++, Swift oder PHP benötigen eigene große Laufzeitumgebungen und laufen nicht nativ in einer normalen iPhone-PWA. Für kleine Schul- und Alltags-Apps reicht der Web-Stack vollständig aus.

## Änderungen veröffentlichen

Lade geänderte Dateien erneut zu GitHub hoch oder arbeite mit Git. GitHub Actions baut automatisch eine neue Version. Öffne die installierte App danach einmal mit Internet; die Offline-Version wird aktualisiert.

## Backup

In der App unter **Daten → Backup laden** regelmäßig eine Sicherung speichern. Vor einem Browser-Reset oder iPhone-Wechsel kannst du sie dort wieder importieren.
