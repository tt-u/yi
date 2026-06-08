/**
 * E2E smoke test: connect to a real Electron instance (CDP) and verify the interaction flow.
 *
 * Covers:
 *  - Main window is the settings page (no translation UI)
 *  - ⌘Y capture → popup translation (dictionary / full sentence)
 *  - Replaceable detection (detectEditable)
 *  - Press Y in the popup to replace the original text
 *
 * Usage (the app must be launched with ATHENA_E2E=1 + --remote-debugging-port=9223):
 *   DEEPSEEK_API_KEY=sk-xxx pnpm e2e
 */
import puppeteer from "puppeteer-core";

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) {
  console.error("Missing DEEPSEEK_API_KEY environment variable");
  process.exit(1);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > timeoutMs)
      throw new Error(`Timed out waiting for: ${label}`);
    await delay(200);
  }
}

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? `  ${detail}` : ""}`);
  if (!ok) failures += 1;
}

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9223",
  defaultViewport: null,
  protocolTimeout: 120_000,
});

const findMain = async () =>
  (await browser.pages()).find(
    (p) => p.url().includes("localhost:5173") && !p.url().includes("popup"),
  );
const findPopup = async () =>
  (await browser.pages()).find((p) => p.url().includes("popup"));

// The main window isn't created automatically at startup; use the prewarmed popup page to summon it
const driver = await waitFor(findPopup, 15_000, "popup page");
await driver.evaluate(() => window.electron.ipcRenderer.send("app:open-main"));
const mainPage = await waitFor(findMain, 15_000, "main window page");
const pageErrors = [];
mainPage.on("pageerror", (e) => pageErrors.push(String(e)));

// Inject the API key and reload the main window
await mainPage.evaluate((key) => {
  localStorage.setItem(
    "yi-settings",
    JSON.stringify({
      deepseekApiKey: key,
      model: "deepseek-chat",
      langA: "zh",
      langB: "en",
      selectionEnabled: true,
      captureShortcut: "CommandOrControl+Y",
      locale: "en",
    }),
  );
}, API_KEY);
await mainPage.reload({ waitUntil: "networkidle0" });
await delay(800);

// Test 1: the main window is the settings page (has the API + Shortcut cards, no translation input box)
const mainIsSettings = await mainPage.evaluate(() => {
  const text = document.body.innerText;
  return (
    text.includes("DeepSeek API") &&
    text.includes("Translation shortcut") &&
    !document.querySelector("textarea")
  );
});
check(
  "Main window is the settings page (no translation input box)",
  mainIsSettings,
);

// Test 2: dictionary lookup → translation appears in the popup card
await mainPage.evaluate(() =>
  window.electron.ipcRenderer.send("e2e:show-popup", "brilliant"),
);
const popupPage = await waitFor(findPopup, 15_000, "popup window page");
popupPage.on("pageerror", (e) => pageErrors.push(`popup: ${e}`));

const wordOk = await waitFor(
  () =>
    popupPage.evaluate(() =>
      /[一-鿿]/.test(document.body.innerText) ? true : null,
    ),
  45_000,
  "dictionary result",
).catch(() => false);
check("Popup card: dictionary lookup shows a translation", Boolean(wordOk));

// After translation completes, the copied marker appears + the translation is written to the clipboard
const copiedShown = await waitFor(
  () =>
    popupPage.evaluate(() =>
      document.body.innerText.includes("Copied") ? true : null,
    ),
  20_000,
  "copied marker",
).catch(() => false);
check("Copied marker shown after translation completes", Boolean(copiedShown));

// Test 3: full-sentence translation (window reuse)
await mainPage.evaluate(() => window.api.clipboard.write("OLD_CLIP"));
await mainPage.evaluate(() =>
  window.electron.ipcRenderer.send(
    "e2e:show-popup",
    "The quick brown fox jumps over the lazy dog.",
  ),
);
const sentenceOk = await waitFor(
  () =>
    popupPage.evaluate(() =>
      /狐狸|狗/.test(document.body.innerText) ? true : null,
    ),
  45_000,
  "full-sentence translation",
).catch(() => false);
check(
  "Popup card: full-sentence translation (window reuse)",
  Boolean(sentenceOk),
);

// Test 4: the translation is written to the clipboard automatically (for the user to ⌘V replace)
const clipReplaced = await waitFor(
  () =>
    mainPage
      .evaluate(() => window.electron.ipcRenderer.invoke("e2e:read-clip"))
      .then((c) => (c && c !== "OLD_CLIP" && /[一-鿿]/.test(c) ? c : null)),
  45_000,
  "translation written to clipboard",
).catch(() => false);
check(
  "Replace flow: translation auto-copied to clipboard (for ⌘V)",
  Boolean(clipReplaced),
  clipReplaced ? JSON.stringify(clipReplaced).slice(0, 40) : "",
);

check(
  "No renderer-process errors",
  pageErrors.length === 0,
  pageErrors.join("; "),
);

await browser.disconnect();
console.log(failures === 0 ? "\nAll passed 🎉" : `\n${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
