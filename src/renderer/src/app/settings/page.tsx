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
import { DeepSeekError, testApiKey } from "@/lib/deepseek";
import { LANGUAGES } from "@/lib/languages";
import { SettingsManager } from "@/lib/settings";
import { applyTheme, type ThemeMode } from "@/lib/theme";

import type { SelectionStatus } from "../../../../preload";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const IS_MAC = window.api?.platform === "darwin";
const MOD = IS_MAC ? "⌘⇧" : "Ctrl+Shift+";

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

const SHORTCUT_OPTIONS = [
  { accel: "CommandOrControl+Y", warn: "Maps to “Redo” in some apps" },
  { accel: "CommandOrControl+T", warn: "Overrides “New Tab” in browsers" },
  { accel: "CommandOrControl+Shift+D", warn: "" },
  { accel: "F9", warn: "" },
];

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
  const [settings, setSettings] = useState(() => SettingsManager.load());
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ kind: "idle" });
  const [selStatus, setSelStatus] = useState<SelectionStatus | null>(null);

  const refreshStatus = () => {
    void window.api?.selection.getStatus().then(setSelStatus);
  };
  useEffect(refreshStatus, []);

  // Any change is persisted automatically; no manual save needed
  useEffect(() => {
    SettingsManager.save(settings);
  }, [settings]);

  const setLangPair = (langA: string, langB: string) =>
    setSettings((s) => ({ ...s, langA, langB }));

  const changeTheme = (theme: ThemeMode) => {
    setSettings((s) => ({ ...s, theme }));
    applyTheme(theme);
  };

  const changeShortcut = async (accel: string) => {
    setSettings((s) => ({ ...s, captureShortcut: accel }));
    setSelStatus(await window.api.selection.setShortcut(accel));
  };

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
          err instanceof DeepSeekError
            ? err.message
            : "Network error: unable to connect",
      });
    }
  };

  const shortcutWarn = SHORTCUT_OPTIONS.find(
    (o) => o.accel === settings.captureShortcut,
  )?.warn;

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-7 px-6 py-8">
      {/* Title */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Yi</h1>
        <p className="text-sm text-muted-foreground">
          DeepSeek capture translation · Settings
        </p>
      </header>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = settings.theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => changeTheme(opt.value)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="size-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* API */}
      <Section title="DeepSeek API">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="API Key (sk-...)"
                autoComplete="off"
                spellCheck={false}
                value={settings.deepseekApiKey}
                onChange={(e) => {
                  setSettings({ ...settings, deepseekApiKey: e.target.value });
                  setTest({ kind: "idle" });
                }}
                className="h-9 pr-9 font-mono text-sm"
              />
              <button
                type="button"
                aria-label={showKey ? "Hide key" : "Show key"}
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
              Test
            </Button>
          </div>
          {test.kind === "ok" && (
            <p className="flex items-center gap-1.5 text-xs text-primary">
              <Check className="size-3.5" />
              Connected
            </p>
          )}
          {test.kind === "fail" && (
            <p className="text-xs text-destructive">{test.message}</p>
          )}
          {test.kind === "idle" && (
            <p className="text-xs text-muted-foreground">
              Create one at{" "}
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                platform.deepseek.com
              </a>
              . The key is stored only on this device.
            </p>
          )}
        </div>
      </Section>

      {/* Languages */}
      <Section title="Languages">
        {/* Language pair */}
        <div className="flex items-center gap-2">
          <Select
            ariaLabel="Source language"
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
            aria-label="Swap languages"
            onClick={() => setLangPair(settings.langB, settings.langA)}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeftRight className="size-4" />
          </button>
          <Select
            ariaLabel="Target language"
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
        <p className="text-xs text-muted-foreground">
          Detects which language the input is in and translates it to the other
        </p>
      </Section>

      {/* Capture */}
      <Section title="Capture & Translate">
        {/* Shortcut */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Capture shortcut</p>
            {selStatus && !selStatus.registered ? (
              <p className="text-xs text-destructive">
                Shortcut already in use, please pick another
              </p>
            ) : shortcutWarn ? (
              <p className="text-xs text-destructive">Note: {shortcutWarn}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select text, then press this key to translate
              </p>
            )}
          </div>
          <Select
            ariaLabel="Capture shortcut"
            value={settings.captureShortcut}
            onChange={(v) => void changeShortcut(v)}
            className="shrink-0 font-mono"
          >
            {SHORTCUT_OPTIONS.map((o) => (
              <option key={o.accel} value={o.accel}>
                {accelToDisplay(o.accel)}
                {o.warn ? " (conflict)" : ""}
              </option>
            ))}
          </Select>
        </div>

        {/* macOS permission */}
        {IS_MAC && selStatus && (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Accessibility permission</p>
              <p className="text-xs text-muted-foreground">
                {selStatus.accessibilityOk
                  ? "Granted"
                  : "Required to capture text (System Settings → Privacy & Security)"}
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
                  Grant access
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label="Refresh permission status"
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
          The translation is copied automatically. Back in the original app,
          press{" "}
          <kbd className="rounded border bg-background px-1 font-mono text-foreground">
            {IS_MAC ? "⌘V" : "Ctrl+V"}
          </kbd>{" "}
          to replace the text.
          <kbd className="ml-1 rounded border bg-background px-1 font-mono text-foreground">
            {MOD}M
          </kbd>{" "}
          shows / hides the main window.
        </div>
      </Section>

      {/* Changes saved automatically */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5 text-primary" />
        Changes are saved automatically
      </p>
    </div>
  );
}
