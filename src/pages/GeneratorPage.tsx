import { useState } from "react";
import {
  Sparkles, ChevronDown, Wand2, BookOpen, FileText, MessageSquare,
  CheckCircle2, Loader2, Edit3, RefreshCw, Save, CalendarPlus, Download, Quote, AlertTriangle,
} from "lucide-react";
import {
  PILLARS, PLATFORMS, DURATIONS, SOURCE_BOOKS, DM_KEYWORDS_LIST,
  CONTENT_GOALS, BRAND,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import api from "@/lib/api";

const STEPS = [
  "Retrieving relevant source passages",
  "Selecting best source frameworks",
  "Generating hook and script",
  "Mapping DM keyword",
  "Checking duplicate risk",
  "Validating script length",
  "Preparing captions and export format",
  "Saving draft to review queue",
];

type GeneratedItem = {
  id?: string | null;
  persisted?: boolean;
  topic: string;
  pillar: string;
  platform: string;
  duration: string;
  word_count: number;
  hook: string;
  script: string;
  on_screen: string;
  production_brief: string;
  caption?: string;
  caption_tiktok?: string;
  caption_instagram?: string;
  caption_linkedin?: string;
  caption_facebook?: string;
  caption_x?: string;
  cta: string;
  dm_keyword: string;
  deliverable: string;
  hashtags: string[];
  source_book: string;
  source_framework: string;
  source_reason: string;
  duplicate_risk: "Low" | "Medium" | "High";
  validations?: { status: string; errors: string[]; warnings: string[] };
};

export function GeneratorPage() {
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<GeneratedItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pillar, setPillar] = useState(PILLARS[0]);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [duration, setDuration] = useState("45 seconds");
  const [goal, setGoal] = useState(CONTENT_GOALS[0]);
  const [topic, setTopic] = useState("Why buyers overpay when they fear losing a house");
  const [sourceStrategy, setSourceStrategy] = useState("Auto-select best sources");
  const [dmKeyword, setDmKeyword] = useState("Auto-select");
  const [selectedBooks, setSelectedBooks] = useState<string[]>([SOURCE_BOOKS[0], SOURCE_BOOKS[1]]);

  const generate = async () => {
    setError(null);
    setGenerating(true);
    setStep(0);
    setResult(null);

    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, STEPS.length - 1);
      setStep(i);
    }, 800);

    try {
      const res = await api.generate.one({
        pillar,
        platform,
        duration,
        topic: topic || undefined,
        goal,
        source_strategy: sourceStrategy,
        dm_keyword: dmKeyword === "Auto-select" ? undefined : dmKeyword,
        source_books: selectedBooks,
        use_perplexity: pillar.startsWith("Geographic"),
        variations: 1,
      });
      clearInterval(interval);
      setStep(STEPS.length);
      const first = res.results?.[0];
      if (first) setResult(first as GeneratedItem);
      else setError("Generation returned no results");
    } catch (e: any) {
      clearInterval(interval);
      setError(e?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const toggleBook = (b: string) =>
    setSelectedBooks((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]));

  const variantClass = (risk?: string): "approved" | "high-risk" | "medium-risk" | "low-risk" =>
    risk === "High" ? "high-risk" : risk === "Medium" ? "medium-risk" : "low-risk";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="kl-card p-7">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-md surface-charcoal border border-sidebar-border">
              <Wand2 className="h-4 w-4 text-accent" strokeWidth={1.5} />
            </div>
            <div>
              <div className="kl-eyebrow text-accent">Generation Engine</div>
              <h2 className="font-display text-[19px] font-medium tracking-tight mt-0.5">
                Configure content package
              </h2>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                All fields feed the generation engine and source retriever
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Content Pillar"><Select options={PILLARS} value={pillar} onChange={setPillar} /></Field>
            <Field label="Target Platform"><Select options={PLATFORMS} value={platform} onChange={setPlatform} /></Field>
            <Field label="Video Duration">
              <Select options={DURATIONS} value={duration} onChange={setDuration} />
            </Field>
            <Field label="Content Goal"><Select options={CONTENT_GOALS} value={goal} onChange={setGoal} /></Field>

            <Field label="Topic" full>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="kl-input"
                placeholder="Why buyers overpay when they fear losing a house"
              />
            </Field>

            <Field label="Source Strategy">
              <Select
                options={["Auto-select best sources", "Choose specific books", "Use content calendar reference", "Use DM deliverable reference"]}
                value={sourceStrategy}
                onChange={setSourceStrategy}
              />
            </Field>
            <Field label="DM Keyword">
              <Select options={["Auto-select", ...DM_KEYWORDS_LIST]} value={dmKeyword} onChange={setDmKeyword} />
            </Field>

            <Field label="Source Books (multi-select)" full>
              <div className="flex flex-wrap gap-1.5">
                {SOURCE_BOOKS.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => toggleBook(b)}
                    className={`kl-chip ${selectedBooks.includes(b) ? "kl-chip-active" : ""}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="btn-cinematic mt-7 w-full py-3.5 text-[13.5px]"
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating package…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                Generate Content Package
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-[12.5px] text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Generation failed</div>
                <div className="text-[11.5px] text-destructive/80 mt-0.5">{error}</div>
              </div>
            </div>
          )}
        </div>

        {(generating || step > 0) && (
          <div className="kl-card p-6">
            <div className="kl-eyebrow text-accent mb-1">Pipeline</div>
            <h3 className="font-display text-[16px] font-medium tracking-tight mb-4">
              Generation process
            </h3>
            {generating && <div className="progress-indeterminate mb-5" />}
            <ol className="space-y-2.5">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step && generating;
                return (
                  <li key={s} className="flex items-center gap-3 text-[13px]">
                    <div className={`flex h-6 w-6 items-center justify-center rounded shrink-0 border transition-all ${
                      done
                        ? "bg-success/15 text-success border-success/30"
                        : active
                          ? "bg-accent/10 text-accent border-accent/30"
                          : "bg-secondary/50 text-muted-foreground border-border"
                    }`}>
                      {done
                        ? <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                        : active
                          ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                          : <span className="font-mono text-[9px]">0{i + 1}</span>}
                    </div>
                    <span className={done ? "text-foreground/70" : active ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {s}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {result && (
          <div className="kl-card kl-card-elevated overflow-hidden p-0 border-accent/30">
            <div className="surface-charcoal text-white px-6 py-4 flex items-center justify-between border-b border-sidebar-border relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-fine opacity-30" />
              <div className="relative flex items-center gap-2.5 text-[13px] font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded border border-accent/30 bg-accent/15">
                  <CheckCircle2 className="h-3 w-3 text-accent" strokeWidth={2} />
                </div>
                <div>
                  <div className="kl-eyebrow text-accent">Generated</div>
                  <div className="text-[13px]">Package ready for review</div>
                </div>
              </div>
              <div className="relative flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                <span className="rounded-sm border border-white/15 bg-white/[0.06] px-2 py-0.5">{result.platform}</span>
                <span className="rounded-sm border border-white/15 bg-white/[0.06] px-2 py-0.5">{result.duration}</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <Label icon={MessageSquare}>Hook</Label>
                <p className="mt-2 text-[19px] font-display font-normal italic leading-snug text-foreground/90">
                  "{result.hook}"
                </p>
              </div>

              <div className="rounded-md border border-border bg-transparent border-l-2 border-l-accent/70 p-4">
                <div className="flex items-center gap-2">
                  <Quote className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                  <div className="kl-eyebrow text-accent">Source Citation</div>
                </div>
                <div className="mt-2 text-[13.5px]">
                  <span className="font-medium">{result.source_book}</span>
                  <span className="text-muted-foreground"> · Framework: </span>
                  <span className="font-medium">{result.source_framework}</span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{result.source_reason}</p>
              </div>

              <div>
                <Label icon={FileText}>
                  Full script
                  <span className="text-muted-foreground font-normal normal-case ml-1.5">· {result.word_count} words</span>
                </Label>
                <p className="mt-2 text-[13.5px] leading-relaxed whitespace-pre-line text-foreground/85">{result.script}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Block label="On-screen text">{result.on_screen}</Block>
                <Block label="Production brief">{result.production_brief}</Block>
                <Block label="Instagram caption">{result.caption_instagram || result.caption}</Block>
                <Block label="TikTok caption">{result.caption_tiktok || result.caption}</Block>
                <Block label="LinkedIn caption">{result.caption_linkedin || result.caption}</Block>
                <Block label="X/Twitter caption">{result.caption_x || result.caption}</Block>
                <Block label="CTA / DM Keyword">
                  <span className="font-mono font-semibold text-accent tracking-wider">{result.dm_keyword}</span>
                  <span className="text-muted-foreground"> → {result.deliverable}</span>
                </Block>
                <Block label="CTA spoken">{result.cta}</Block>
              </div>

              <div>
                <Label icon={BookOpen}>Hashtags</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(result.hashtags || []).map((h) => (
                    <span key={h} className="kl-tag kl-tag-mono">{h}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="kl-eyebrow mb-2.5">Validation</div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge
                    label={result.validations?.status === "Valid" ? "All checks passed" : `${result.validations?.errors.length ?? 0} error(s)`}
                    variant={result.validations?.status === "Valid" ? "approved" : "warning"}
                  />
                  <StatusBadge label="DM keyword mapped" variant="approved" />
                  <StatusBadge label="Source citation included" variant="approved" />
                  <StatusBadge label="Compliance footer included" variant="approved" />
                  <StatusBadge label={`Duplicate risk: ${result.duplicate_risk}`} variant={variantClass(result.duplicate_risk)} />
                </div>
                {result.validations?.warnings?.length ? (
                  <ul className="mt-3 space-y-1 text-[12px] text-muted-foreground">
                    {result.validations.warnings.map((w, i) => <li key={i}>· {w}</li>)}
                  </ul>
                ) : null}
              </div>

              <div className="rounded-md bg-secondary/40 p-3 text-[11.5px] text-muted-foreground border border-border leading-relaxed font-mono">
                {BRAND.compliance}
              </div>

              {result.persisted === false && (
                <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] text-warning leading-relaxed">
                  <span className="font-medium">Preview only.</span>{" "}
                  This draft was generated but not saved to the database (PERSIST_GENERATED_CONTENT is off, e.g. Supabase is read-only).
                  Copy any content you need before refreshing — Approve, Save, Calendar and Export are disabled.
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <Btn icon={CheckCircle2} primary
                  disabled={!result.id}
                  title={!result.id ? "Disabled: draft is preview-only" : undefined}
                  onClick={async () => {
                    if (!result.id) return;
                    await api.content.patch(result.id, { status: "Approved" });
                  }}>Approve</Btn>
                <Btn icon={Edit3}>Edit</Btn>
                <Btn icon={RefreshCw} onClick={generate}>Regenerate</Btn>
                <Btn icon={Save}
                  disabled={!result.id}
                  title={!result.id ? "Disabled: draft is preview-only" : undefined}
                >Save to History</Btn>
                <Btn icon={CalendarPlus}
                  disabled={!result.id}
                  title={!result.id ? "Disabled: draft is preview-only" : undefined}
                >Send to Calendar</Btn>
                <Btn icon={Download}
                  disabled={!result.id}
                  title={!result.id ? "Disabled: draft is preview-only" : undefined}
                  onClick={async () => {
                    if (!result.id) return;
                    const r = await api.export.create({ name: `Package — ${result.topic}`, format: "word", content_ids: [result.id] });
                    if (r?.export?.download_url) {
                      const a = document.createElement("a");
                      a.href = r.export.download_url;
                      a.download = `${(result.topic || "package").replace(/[^a-z0-9]/gi, "_")}.docx`;
                      a.click();
                    }
                  }}>Export</Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="kl-card p-6">
          <div className="kl-eyebrow text-accent mb-1">Output Schema</div>
          <h3 className="font-display text-[16px] font-medium tracking-tight mb-3">Expected output</h3>
          <ul className="space-y-2 text-[13px]">
            {["Hook", "Script", "On-screen text", "Production brief", "5 platform captions", "CTA", "Hashtags"].map((x, i) => (
              <li key={x} className="flex items-center gap-2.5 text-foreground/80">
                <span className="font-mono text-[10px] text-accent w-5">0{i + 1}</span>
                <CheckCircle2 className="h-3 w-3 text-accent shrink-0" strokeWidth={2} />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="kl-card p-6">
          <div className="kl-eyebrow text-accent mb-1">Constraints</div>
          <h3 className="font-display text-[16px] font-medium tracking-tight">Script word target</h3>
          <p className="text-[12px] text-muted-foreground mb-3 mt-0.5">Based on selected duration</p>
          <div className="space-y-1.5 text-[13px]">
            {[["30 sec", "65–85"], ["45 sec", "95–115"], ["60 sec", "120–150"]].map(([d, w]) => (
              <div
                key={d}
                className={`flex items-center justify-between rounded-md px-3 py-2 border transition-colors ${
                  duration.startsWith(d.split(" ")[0])
                    ? "bg-accent/[0.08] border-accent/40"
                    : "bg-transparent border-border"
                }`}
              >
                <span className="font-medium">{d}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{w} words</span>
              </div>
            ))}
          </div>
        </div>

        <div className="kl-card p-6">
          <div className="kl-eyebrow text-accent mb-1">Compliance</div>
          <h3 className="font-display text-[16px] font-medium tracking-tight mb-3">Mandatory footer</h3>
          <div className="rounded-md border border-border bg-transparent p-3 text-[11.5px] leading-relaxed text-muted-foreground font-mono">
            {BRAND.compliance}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({ options, value, onChange }: { options: string[]; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="kl-input appearance-none pr-9"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
    </div>
  );
}

function Label({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      <Icon className="h-3 w-3" strokeWidth={1.75} /> {children}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-transparent p-3.5">
      <div className="kl-eyebrow text-[9.5px] mb-1.5">{label}</div>
      <div className="text-[12.5px] text-foreground/85 leading-relaxed">{children}</div>
    </div>
  );
}

function Btn({
  children,
  icon: Icon,
  primary,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  icon: React.ElementType;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${primary ? "btn-cinematic" : "btn-cinematic-secondary"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </button>
  );
}
