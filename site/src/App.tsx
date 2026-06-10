import {
  ClipboardCheck,
  KeyRound,
  Languages,
  MessageSquare,
  Palette,
  Shield,
  Zap,
} from "lucide-react";

import { getLocale, setLocale, useT } from "./i18n";

/** GitHub mark (lucide v1 dropped brand icons) */
function Github({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

const GITHUB = "https://github.com/tt-u/yi";
// Stable direct-download links: always the matching installer from the latest release.
const DL_BASE = "https://github.com/tt-u/yi/releases/latest/download";

function Nav() {
  const t = useT();
  const locale = getLocale();
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <a href="#top" className="text-lg font-semibold tracking-tight">
          Yi
        </a>
        <nav className="flex items-center gap-1 text-sm">
          <a
            href="#features"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {t("nav.features")}
          </a>
          <a
            href="#download"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {t("nav.download")}
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="size-4" />
          </a>
          <button
            type="button"
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-accent"
          >
            <Languages className="size-3.5" />
            {locale === "zh" ? "中" : "EN"}
          </button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const t = useT();
  return (
    <section className="mx-auto max-w-5xl px-5 pt-20 pb-10 text-center sm:pt-28">
      <h1 className="mx-auto max-w-3xl text-4xl leading-tight font-semibold tracking-tight whitespace-pre-line sm:text-6xl">
        {t("hero.title")}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {t("hero.sub")}
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#download"
          className="rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
        >
          {t("hero.download")}
        </a>
        <a
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-base font-medium transition-colors hover:bg-accent"
        >
          <Github className="size-4" />
          {t("hero.github")}
        </a>
      </div>
    </section>
  );
}

/** Product showcase. CSS mock of the capture popup now; the HyperFrames promo video drops in here later. */
function Showcase() {
  const t = useT();
  return (
    <section className="mx-auto max-w-5xl px-5 pb-20">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* faux window chrome */}
        <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-3">
          <span className="size-3 rounded-full bg-[#e0573e]" />
          <span className="size-3 rounded-full bg-[#e3b341]" />
          <span className="size-3 rounded-full bg-[#3fb950]" />
        </div>
        <div className="relative min-h-[300px] bg-muted/40 p-8 sm:p-12">
          {/* the source text being "selected" */}
          <p className="max-w-md text-lg leading-relaxed">
            <span className="rounded bg-primary/15 box-decoration-clone px-1 py-0.5">
              {t("showcase.demoText")}
            </span>
          </p>

          {/* the Yi popup card floating by the cursor */}
          <div className="mt-8 w-[340px] max-w-full rounded-2xl border border-border bg-card shadow-2xl sm:absolute sm:right-12 sm:bottom-12 sm:mt-0">
            <div className="flex gap-3.5 py-4 pr-6 pl-5">
              <span className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full bg-primary/70" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-relaxed text-foreground">
                  {t("showcase.demoResult")}
                </p>
                <div className="mt-2.5 flex items-center gap-1 text-xs font-medium text-primary">
                  <ClipboardCheck className="size-3" />
                  {t("showcase.copied")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("showcase.caption")}
      </p>
    </section>
  );
}

const FEATURES = [
  { icon: Zap, t: "f.instant.t", d: "f.instant.d" },
  { icon: MessageSquare, t: "f.convo.t", d: "f.convo.d" },
  { icon: ClipboardCheck, t: "f.paste.t", d: "f.paste.d" },
  { icon: KeyRound, t: "f.source.t", d: "f.source.d" },
  { icon: Palette, t: "f.ui.t", d: "f.ui.d" },
  { icon: Shield, t: "f.privacy.t", d: "f.privacy.d" },
];

function Features() {
  const t = useT();
  return (
    <section
      id="features"
      className="border-t border-border/60 bg-card/40 py-20"
    >
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight">
          {t("features.title")}
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, t: title, d }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t(title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(d)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLATFORMS = [
  {
    t: "dl.mac.apple",
    note: "dl.mac.appleNote",
    file: "Yi-macOS-Apple-Silicon.dmg",
  },
  { t: "dl.mac.intel", note: "dl.mac.intelNote", file: "Yi-macOS-Intel.dmg" },
  { t: "dl.win", note: "dl.winNote", file: "Yi-Windows-x64-Setup.exe" },
];

function Download() {
  const t = useT();
  return (
    <section id="download" className="py-20">
      <div className="mx-auto max-w-5xl px-5 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          {t("dl.title")}
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {PLATFORMS.map(({ t: title, note, file }) => (
            <a
              key={title}
              href={`${DL_BASE}/${file}`}
              download
              className="group rounded-2xl border border-border bg-card p-6 text-left transition-transform hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold">{t(title)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(note)}</p>
              <span className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                {t("dl.get")}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 text-center">
        <p className="text-lg font-semibold">Yi</p>
        <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
        <div className="flex items-center gap-4 text-sm">
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href="#download"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("nav.download")}
          </a>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("footer.madeWith")}
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div id="top">
      <Nav />
      <main>
        <Hero />
        <Showcase />
        <Features />
        <Download />
      </main>
      <Footer />
    </div>
  );
}
