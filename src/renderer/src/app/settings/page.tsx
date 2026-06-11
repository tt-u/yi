import {
  ArrowLeftRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeepSeekError, RELAY_AVAILABLE, testApiKey } from "@/lib/deepseek";
import { getLocale, type Locale, setLocale, useT } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/languages";
import { SettingsManager, type TranslationSource } from "@/lib/settings";
import { applyTheme, type ThemeMode } from "@/lib/theme";

import type { SelectionStatus } from "../../../../preload";

const IS_MAC = window.api?.platform === "darwin";
const MOD = IS_MAC ? "⌘⇧" : "Ctrl+Shift+";
const PASTE_KEY = IS_MAC ? "⌘V" : "Ctrl+V";

const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"];
const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const;

/** accelerator -> human-readable key text */
function accelToDisplay(accel: string): string {
  if (IS_MAC) {
    return accel
      .replace("CommandOrControl+", "⌘")
      .replace("Shift+", "⇧")
      .replace("Alt+", "⌥");
  }
  return accel.replace("CommandOrControl", "Ctrl");
}

/** Map a KeyboardEvent's main (non-modifier) key to an Electron accelerator token */
function mainKey(key: string): string | null {
  if (["Control", "Meta", "Alt", "Shift", "Escape"].includes(key)) return null;
  if (/^[a-z]$/i.test(key)) return key.toUpperCase();
  if (/^[0-9]$/.test(key)) return key;
  if (/^F\d{1,2}$/.test(key)) return key;
  const map: Record<string, string> = {
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    " ": "Space",
    Enter: "Return",
    Tab: "Tab",
  };
  if (map[key]) return map[key];
  return key.length === 1 ? key.toUpperCase() : null;
}

/** Build an Electron accelerator from a key event; returns null until a valid combo is pressed. */
function buildAccelerator(e: KeyboardEvent): string | null {
  const mods: string[] = [];
  if (IS_MAC) {
    if (e.metaKey) mods.push("CommandOrControl");
    if (e.ctrlKey) mods.push("Control");
  } else {
    if (e.ctrlKey) mods.push("CommandOrControl");
    if (e.metaKey) mods.push("Super");
  }
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");

  const main = mainKey(e.key);
  if (!main) return null;
  // Require a modifier unless it's a function key, so a bare letter doesn't
  // swallow every keystroke system-wide.
  const isFn = /^F\d{1,2}$/.test(main);
  if (mods.length === 0 && !isFn) return null;
  return [...mods, main].join("+");
}

type TestState =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "ok" }
  | { kind: "fail"; message: string };

/** Native select with consistent styling */
function Select({
  value,
  onChange,
  children,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 cursor-pointer appearance-none rounded-lg border bg-background px-3 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {children}
    </select>
  );
}

/** Section: heading + content */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default function Page() {
  const t = useT();
  const [settings, setSettings] = useState(() => SettingsManager.load());
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ kind: "idle" });
  const [selStatus, setSelStatus] = useState<SelectionStatus | null>(null);
  const [recording, setRecording] = useState(false);

  const refreshStatus = () => {
    void window.api?.selection.getStatus().then(setSelStatus);
  };
  useEffect(refreshStatus, []);

  // Tell the main process the UI language on mount, so the tray menu matches.
  useEffect(() => {
    window.api?.setLocale?.(getLocale());
  }, []);

  // Any change is persisted automatically; no manual save needed
  useEffect(() => {
    SettingsManager.save(settings);
  }, [settings]);

  // While recording, capture the next valid key combo as the new shortcut.
  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(false);
        return;
      }
      const accel = buildAccelerator(e);
      if (!accel) return; // wait for a valid combo (needs a modifier or function key)
      setRecording(false);
      setSettings((s) => ({ ...s, captureShortcut: accel }));
      void window.api.selection.setShortcut(accel).then(setSelStatus);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [recording]);

  const setLangPair = (langA: string, langB: string) =>
    setSettings((s) => ({ ...s, langA, langB }));

  const cycleTheme = () => {
    const next =
      THEME_CYCLE[
        (THEME_CYCLE.indexOf(settings.theme) + 1) % THEME_CYCLE.length
      ];
    setSettings((s) => ({ ...s, theme: next }));
    applyTheme(next);
  };

  const changeLocale = (next: Locale) => {
    setSettings((s) => ({ ...s, locale: next }));
    setLocale(next);
    window.api?.setLocale?.(next);
  };

  const changeSource = (src: TranslationSource) =>
    setSettings((s) => ({ ...s, translationSource: src }));

  // Use the built-in relay only when this build ships one AND the user picked it.
  const relayMode = RELAY_AVAILABLE && settings.translationSource === "relay";

  const handleTest = async () => {
    if (!settings.deepseekApiKey) return;
    setTest({ kind: "testing" });
    try {
      await testApiKey(settings.deepseekApiKey);
      setTest({ kind: "ok" });
    } catch (err) {
      setTest({
        kind: "fail",
        message:
          err instanceof DeepSeekError ? err.message : t("apiKey.networkError"),
      });
    }
  };

  const ThemeIcon = THEME_ICON[settings.theme];
  const locale = getLocale();

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-7 px-6 py-8">
      {/* Title + compact theme / language icons */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Yi</h1>
          <p className="text-sm text-muted-foreground">{t("app.tagline")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={cycleTheme}
            title={t(`theme.${settings.theme}`)}
            aria-label={t(`theme.${settings.theme}`)}
            className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ThemeIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => changeLocale(locale === "zh" ? "en" : "zh")}
            title={t("locale.switch")}
            aria-label={t("locale.switch")}
            className="flex size-9 items-center justify-center rounded-lg border text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {locale === "zh" ? "中" : "EN"}
          </button>
        </div>
      </header>

      {/* Translation source */}
      <Section title={t("section.translation")}>
        {RELAY_AVAILABLE && (
          <div className="grid grid-cols-2 gap-2">
            {(["relay", "own"] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => changeSource(src)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  settings.translationSource === src
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-accent"
                }`}
              >
                {t(`source.${src}`)}
              </button>
            ))}
          </div>
        )}

        {relayMode ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="size-3.5 text-primary" />
            {t("source.relayHint")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={t("apiKey.placeholder")}
                  autoComplete="off"
                  spellCheck={false}
                  value={settings.deepseekApiKey}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      deepseekApiKey: e.target.value,
                    });
                    setTest({ kind: "idle" });
                  }}
                  className="h-9 pr-9 font-mono text-sm"
                />
                <button
                  type="button"
                  aria-label={showKey ? t("apiKey.hide") : t("apiKey.show")}
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showKey ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </button>
              </div>
              <Button
                variant="outline"
                className="h-9"
                onClick={handleTest}
                disabled={!settings.deepseekApiKey || test.kind === "testing"}
              >
                {test.kind === "testing" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("apiKey.test")}
              </Button>
            </div>
            {test.kind === "ok" && (
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <Check className="size-3.5" />
                {t("apiKey.connected")}
              </p>
            )}
            {test.kind === "fail" && (
              <p className="text-xs text-destructive">{test.message}</p>
            )}
            {test.kind === "idle" && (
              <p className="text-xs text-muted-foreground">
                {t("apiKey.hintBefore")}{" "}
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  platform.deepseek.com
                </a>
                {t("apiKey.hintAfter")}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Languages */}
      <Section title={t("section.languages")}>
        <div className="flex items-center gap-2">
          <Select
            ariaLabel={t("lang.source")}
            value={settings.langA}
            onChange={(code) => setLangPair(code, settings.langB)}
            className="flex-1"
          >
            {LANGUAGES.map((l) => (
              <option
                key={l.code}
                value={l.code}
                disabled={l.code === settings.langB}
              >
                {l.label}
              </option>
            ))}
          </Select>
          <button
            type="button"
            aria-label={t("lang.swap")}
            onClick={() => setLangPair(settings.langB, settings.langA)}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeftRight className="size-4" />
          </button>
          <Select
            ariaLabel={t("lang.target")}
            value={settings.langB}
            onChange={(code) => setLangPair(settings.langA, code)}
            className="flex-1"
          >
            {LANGUAGES.map((l) => (
              <option
                key={l.code}
                value={l.code}
                disabled={l.code === settings.langA}
              >
                {l.label}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">{t("lang.hint")}</p>
      </Section>

      {/* Shortcut */}
      <Section title={t("section.shortcut")}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("shortcut.label")}</p>
            {recording ? (
              <p className="text-xs text-primary">{t("shortcut.recording")}</p>
            ) : selStatus && !selStatus.registered ? (
              <p className="text-xs text-destructive">{t("shortcut.inUse")}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("shortcut.hint")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setRecording((r) => !r)}
            aria-label={t("shortcut.label")}
            className={`flex h-9 min-w-[88px] shrink-0 items-center justify-center rounded-lg border px-3 font-mono text-sm transition-colors ${
              recording
                ? "border-primary text-primary ring-1 ring-primary"
                : "hover:bg-accent"
            }`}
          >
            {recording ? "…" : accelToDisplay(settings.captureShortcut)}
          </button>
        </div>

        {/* auto-copy toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("autoCopy.title")}</p>
            <p className="text-xs text-muted-foreground">
              {t("autoCopy.hint")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.autoCopy}
            aria-label={t("autoCopy.title")}
            onClick={() =>
              setSettings((s) => ({ ...s, autoCopy: !s.autoCopy }))
            }
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              settings.autoCopy ? "bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform ${
                settings.autoCopy ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* macOS permission */}
        {IS_MAC && selStatus && (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("a11y.title")}</p>
              <p className="text-xs text-muted-foreground">
                {selStatus.accessibilityOk
                  ? t("a11y.granted")
                  : t("a11y.required")}
              </p>
            </div>
            {selStatus.accessibilityOk ? (
              <Check className="size-4 shrink-0 text-primary" />
            ) : (
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => void window.api.accessibility.request()}
                >
                  {t("a11y.grant")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label={t("a11y.refresh")}
                  onClick={refreshStatus}
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Usage hint */}
        <div className="rounded-lg bg-muted/50 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
          {t("usage.before")}{" "}
          <kbd className="rounded border bg-background px-1 font-mono text-foreground">
            {PASTE_KEY}
          </kbd>{" "}
          {t("usage.between")}
          <kbd className="ml-1 rounded border bg-background px-1 font-mono text-foreground">
            {MOD}M
          </kbd>{" "}
          {t("usage.after")}
        </div>
      </Section>

      {/* Changes saved automatically */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5 text-primary" />
        {t("settings.saved")}
      </p>
    </div>
  );
}
