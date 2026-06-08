import { Check, Loader2, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DeepSeekError, translate } from "@/lib/deepseek";
import { useT } from "@/lib/i18n";
import { SettingsManager } from "@/lib/settings";

const PASTE_KEY = window.api?.platform === "darwin" ? "⌘V" : "Ctrl+V";

type ViewState =
  | { kind: "empty" }
  | { kind: "no-key" }
  | { kind: "loading" }
  | { kind: "result"; text: string; streaming: boolean; copied: boolean }
  | { kind: "error"; message: string; needsAccessibility?: boolean };

export default function Page() {
  const t = useT();
  const [view, setView] = useState<ViewState>({ kind: "empty" });
  const abortRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
  });

  const runQuery = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const settings = SettingsManager.load();
      if (!settings.deepseekApiKey) {
        setView({ kind: "no-key" });
        return;
      }

      setView({ kind: "loading" });
      try {
        const full = await translate({
          apiKey: settings.deepseekApiKey,
          model: settings.model,
          text,
          langA: settings.langA,
          langB: settings.langB,
          signal: controller.signal,
          onDelta: (_, partial) =>
            setView({
              kind: "result",
              text: partial,
              streaming: true,
              copied: false,
            }),
        });
        if (controller.signal.aborted) return;
        // Write the translation to the clipboard so the user can ⌘V to replace the original in the source app
        if (full) window.api.clipboard.write(full);
        setView({ kind: "result", text: full, streaming: false, copied: true });
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
          needsAccessibility: payload.code === "no-accessibility",
        });
      }
    });
    window.api.popup.ready();
    return unsubscribe;
  }, [runQuery, t]);

  return (
    // p-3 leaves room for the shadow (window is transparent, shadow drawn inside); ref on the outermost element to measure height including padding
    <div ref={cardRef} className="p-3">
      <div className="animate-in fade-in zoom-in-95 relative overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl duration-150">
        {/* Close button */}
        <button
          type="button"
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
            {view.needsAccessibility && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 px-2.5"
                onClick={() => void window.api.accessibility.request()}
              >
                {t("a11y.grant")}
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
              {view.copied && (
                <div className="mt-2.5 flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="size-3" />
                  {t("popup.copied", { key: PASTE_KEY })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
