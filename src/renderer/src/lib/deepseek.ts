import { t } from "./i18n";
import { getLanguage } from "./languages";
import type { DeepSeekModel } from "./settings";

const API_BASE = "https://api.deepseek.com";

export class DeepSeekError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "DeepSeekError";
    this.status = status;
  }
}

function friendlyError(status: number, raw: string): string {
  if (status === 401) return t("deepseek.401");
  if (status === 402) return t("deepseek.402");
  if (status === 429) return t("deepseek.429");
  if (status >= 500) return t("deepseek.5xx");
  return raw || t("deepseek.failed", { status });
}

export interface TranslateOptions {
  apiKey: string;
  model: DeepSeekModel;
  text: string;
  /** Language pair codes; detects which one the input is in and translates to the other */
  langA: string;
  langB: string;
  signal?: AbortSignal;
  /** Called for each incremental chunk; full is the complete translation so far */
  onDelta?: (delta: string, full: string) => void;
}

/** Internal: streaming chat completion with per-chunk callbacks */
async function streamChat(options: {
  apiKey: string;
  model: DeepSeekModel;
  systemPrompt: string;
  userContent: string;
  temperature: number;
  signal?: AbortSignal;
  onDelta?: (delta: string, full: string) => void;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userContent },
      ],
      temperature: options.temperature,
      stream: true,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    let raw = "";
    try {
      const body = await res.json();
      raw = body?.error?.message ?? "";
    } catch {
      // Ignore failures parsing the response body
    }
    throw new DeepSeekError(friendlyError(res.status, raw), res.status);
  }

  if (!res.body) {
    throw new DeepSeekError(t("deepseek.stream"));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  // Parse SSE: each line is "data: {...}", terminated by "data: [DONE]"
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta: string = json?.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          options.onDelta?.(delta, full);
        }
      } catch {
        // Skip incomplete JSON fragments
      }
    }
  }

  return full;
}

/** Streaming translation; returns the full translated text */
export async function translate(options: TranslateOptions): Promise<string> {
  const { apiKey, model, text, langA, langB, signal, onDelta } = options;
  const a = getLanguage(langA).promptName;
  const b = getLanguage(langB).promptName;

  return streamChat({
    apiKey,
    model,
    systemPrompt:
      `You are a professional translation engine between ${a} and ${b}. ` +
      `If the input is mainly in ${a}, translate it into ${b}; otherwise translate it into ${a}. ` +
      `Return ONLY the translated text. ` +
      `Do not add explanations, notes, alternatives, phonetics, pinyin, part-of-speech labels, dictionary entries, or quotation marks. ` +
      `Even for a single word or short phrase, just give its most natural translation as plain text. ` +
      `Preserve the original tone, formatting and line breaks.`,
    userContent: text,
    // DeepSeek officially recommends 1.3 for translation use cases
    temperature: 1.3,
    signal,
    onDelta,
  });
}

/** Verify that the API key is valid */
export async function testApiKey(apiKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new DeepSeekError(friendlyError(res.status, ""), res.status);
  }
}
