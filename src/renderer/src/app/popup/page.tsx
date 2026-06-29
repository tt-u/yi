import { Check, Copy, Loader2, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DeepSeekError,
  RELAY_AVAILABLE,
  translate,
  translateViaRelay,
} from "@/lib/deepseek";
import { useT } from "@/lib/i18n";
import { SettingsManager } from "@/lib/settings";

const PASTE_KEY = window.api?.platform === "darwin" ? "⌘V" : "Ctrl+V";
const COPY_KEY = window.api?.platform === "darwin" ? "⌘C" : "Ctrl+C";

type ViewState =
  | { kind: "empty" }
  | { kind: "no-key" }
  | { kind: "loading" }
  | { kind: "result"; text: string; streaming: boolean; copied: boolean }
  | {
      kind: "error";
      message: string;
      action?: "accessibility" | "automation";
    };

export default function Page() {
  const t = useT();
  const [view, setView] = useState<ViewState>({ kind: "empty" });
  const [autoCopy, setAutoCopy] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Manual copy (when auto-copy is off): write to clipboard, show "copied",
  // then close the popup so focus returns to the source app — the user can ⌘V
  // straight into the chat without clicking back first.
  const doCopy = useCallback((text: string) => {
    window.api.clipboard.write(text);
    setView((v) => (v.kind === "result" ? { ...v, copied: true } : v));
    window.setTimeout(() => window.api.popup.hide(), 650);
  }, []);

  // Transparent window background + disable page scrolling (window height is matched to content via resize)
  useEffect(() => {
    const html = document.documentElement;
    html.style.background = "transparent";
    html.style.overflow = "hidden";
    document.body.style.background = "transparent";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.background = "";
      html.style.overflow = "";
      document.body.style.background = "";
      document.body.style.overflow = "";
    };
  }, []);

  // When content height changes, tell the main process to resize the window so it grows to fit the card.
  // Measure the outermost container (including the padding reserved for the shadow), otherwise the window
  // would undercount the padding and cause overflow scrolling.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const report = () => window.api.popup.resize(Math.ceil(el.scrollHeight));
    const ro = new ResizeObserver(report);
    ro.observe(el);
    report();
    return () => ro.disconnect();
  }, []);

  const runQuery = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const settings = SettingsManager.load();
      setAutoCopy(settings.autoCopy);
      const useRelay =
        settings.translationSource === "relay" && RELAY_AVAILABLE;
      if (!useRelay && !settings.deepseekApiKey) {
        setView({ kind: "no-key" });
        return;
      }

      setView({ kind: "loading" });
      try {
        const onDelta = (_: string, partial: string) =>
          setView({
            kind: "result",
            text: partial,
            streaming: true,
            copied: false,
          });
        const full = useRelay
          ? await translateViaRelay({
              text,
              langA: settings.langA,
              langB: settings.langB,
              signal: controller.signal,
              onDelta,
            })
          : await translate({
              apiKey: settings.deepseekApiKey,
              model: settings.model,
              text,
              langA: settings.langA,
              langB: settings.langB,
              signal: controller.signal,
              onDelta,
            });
        if (controller.signal.aborted) return;
        // Auto-copy (default): write to clipboard + arm ⌘V to close & replay the
        // paste into the source app. When off, the user copies manually in the popup.
        if (full && settings.autoCopy) {
          window.api.clipboard.write(full);
          window.api.popup.copied();
        }
        setView({
          kind: "result",
          text: full,
          streaming: false,
          copied: settings.autoCopy,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setView({
          kind: "error",
          message:
            err instanceof DeepSeekError
              ? err.message
              : t("popup.networkError"),
        });
      }
    },
    [t],
  );

  // Receive capture payloads delivered by the main process
  useEffect(() => {
    const unsubscribe = window.api.popup.onPayload((payload) => {
      if (payload.kind === "pending") {
        setView({ kind: "loading" });
      } else if (payload.kind === "text") {
        void runQuery(payload.text);
      } else {
        setView({
          kind: "error",
          message: t(`error.${payload.code}`),
          action:
            payload.code === "no-accessibility"
              ? "accessibility"
              : payload.code === "no-automation"
                ? "automation"
                : undefined,
        });
      }
    });
    window.api.popup.ready();
    return unsubscribe;
  }, [runQuery, t]);

  // When auto-copy is off, ⌘C in the focused popup copies the translation.
  useEffect(() => {
    if (view.kind !== "result" || autoCopy || view.copied) return;
    const text = view.text;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault();
        doCopy(text);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [view, autoCopy, doCopy]);

  return (
    // p-3 leaves room for the shadow (window is transparent, shadow drawn inside); ref on the outermost element to measure height including padding
    <div ref={cardRef} className="p-3">
      <div className="animate-in fade-in zoom-in-95 relative overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl duration-150">
        {/* Close button */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={t("popup.close")}
          onClick={() => window.api.popup.hide()}
          className="absolute top-1.5 right-1.5 z-10 rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>

        {view.kind === "empty" && (
          <p className="px-5 py-4 text-sm text-muted-foreground">
            {t("popup.empty")}
          </p>
        )}

        {view.kind === "loading" && (
          <div className="flex items-center gap-3 px-5 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            {t("popup.translating")}
          </div>
        )}

        {view.kind === "no-key" && (
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="text-sm text-muted-foreground">
              {t("popup.noKey")}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 px-2.5"
              onClick={() => window.api.openMain()}
            >
              <Settings2 className="size-3.5" />
              {t("popup.settings")}
            </Button>
          </div>
        )}

        {view.kind === "error" && (
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="text-sm text-destructive">{view.message}</span>
            {view.action === "accessibility" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 px-2.5"
                onClick={() => void window.api.accessibility.request()}
              >
                {t("a11y.grant")}
              </Button>
            )}
            {view.action === "automation" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 px-2.5"
                onClick={() => window.api.system.openAutomationSettings()}
              >
                {t("a11y.openSettings")}
              </Button>
            )}
          </div>
        )}

        {view.kind === "result" && (
          // Cobalt-blue accent bar on the left + the translation body; the translation is the clear visual focus
          <div className="flex gap-3.5 py-4 pr-7 pl-5">
            <span className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full bg-primary/70" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
                {view.text}
                {view.streaming && (
                  <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-primary align-text-bottom" />
                )}
              </p>
              {view.copied ? (
                <div className="mt-2.5 flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="size-3" />
                  {autoCopy
                    ? t("popup.copied", { key: PASTE_KEY })
                    : t("popup.copyDone")}
                </div>
              ) : (
                !view.streaming && (
                  <button
                    type="button"
                    onClick={() => doCopy(view.text)}
                    className="mt-2.5 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Copy className="size-3" />
                    {t("popup.copy", { key: COPY_KEY })}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
