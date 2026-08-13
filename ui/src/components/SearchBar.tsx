import { For, Show, createSignal } from "solid-js";

export interface SearchParams {
  q: string;
  account: number | null;
  from: string;
  fromExact: string;
  fromDomain: string;
  to: string;
  subject: string;
  body: string;
  since: number | null;
  until: number | null;
  starred: boolean | null;
  unseen: boolean | null;
  inInbox: boolean | null;
  inSent: boolean | null;
  inDrafts: boolean | null;
  snoozed: boolean | null;
  hasAttachments: boolean | null;
}

export const emptyParams: SearchParams = {
  q: "",
  account: null,
  from: "",
  fromExact: "",
  fromDomain: "",
  to: "",
  subject: "",
  body: "",
  since: null,
  until: null,
  starred: null,
  unseen: null,
  inInbox: null,
  inSent: null,
  inDrafts: null,
  snoozed: null,
  hasAttachments: null,
};

export type ToggleKey =
  | "starred"
  | "unseen"
  | "inInbox"
  | "inSent"
  | "inDrafts"
  | "snoozed"
  | "hasAttachments";

export type TextField = "from" | "fromExact" | "fromDomain" | "to" | "subject" | "body";

interface Toggle {
  key: ToggleKey;
  label: string;
  icon: string;
}

const toggles: Toggle[] = [
  { key: "inInbox", label: "Inbox", icon: "▣" },
  { key: "inSent", label: "Sent", icon: "➤" },
  { key: "inDrafts", label: "Drafts", icon: "✎" },
  { key: "starred", label: "Starred", icon: "★" },
  { key: "unseen", label: "Unseen", icon: "●" },
  { key: "snoozed", label: "Snoozed", icon: "⏾" },
  { key: "hasAttachments", label: "Attachments", icon: "❒" },
];

interface TextFieldSpec {
  key: TextField;
  label: string;
  placeholder: string;
}

const textFields: TextFieldSpec[] = [
  { key: "from", label: "Sender", placeholder: "contains…" },
  { key: "fromExact", label: "Sender (exact)", placeholder: "name@example.com" },
  { key: "fromDomain", label: "Sender domain", placeholder: "stripe.com" },
  { key: "to", label: "Recipient", placeholder: "contains…" },
  { key: "subject", label: "Subject", placeholder: "contains…" },
  { key: "body", label: "Content", placeholder: "search body text…" },
];

interface Props {
  params: SearchParams;
  toggles: Record<ToggleKey, boolean | null>;
  onQuery: (q: string) => void;
  onTextField: (key: TextField, value: string) => void;
  onSince: (value: number | null) => void;
  onUntil: (value: number | null) => void;
  onToggle: (key: ToggleKey) => void;
  onSubmit: () => void;
  onClear: () => void;
}

function dateToUnix(value: string): number | null {
  if (!value) return null;
  return Math.floor(new Date(`${value}T00:00:00`).getTime() / 1000);
}

function unixToDate(value: number | null): string {
  if (value === null) return "";
  const d = new Date(value * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function summarize(params: SearchParams): string[] {
  const parts: string[] = [];
  if (params.q) parts.push(params.q);
  if (params.from) parts.push(`sender: ${params.from}`);
  if (params.fromExact) parts.push(`sender = ${params.fromExact}`);
  if (params.fromDomain) parts.push(`@${params.fromDomain}`);
  if (params.to) parts.push(`to: ${params.to}`);
  if (params.subject) parts.push(`subject: ${params.subject}`);
  if (params.body) parts.push(`content: ${params.body}`);
  if (params.since !== null) parts.push(`from ${unixToDate(params.since)}`);
  if (params.until !== null) parts.push(`to ${unixToDate(params.until)}`);
  for (const t of toggles) {
    if (params[t.key] === true) parts.push(t.label);
  }
  return parts;
}

export default function SearchBar(props: Props) {
  const [expanded, setExpanded] = createSignal(false);
  const summary = () => summarize(props.params);

  return (
    <div
      class={`rounded-xl border bg-paper/80 transition-shadow ${
        expanded() ? "border-vermilion shadow-lg shadow-vermilion/10" : "border-ink/10"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        class="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span class="font-display text-vermilion text-lg leading-none">⌕</span>
        <Show
          when={summary().length > 0}
          fallback={
            <span class="font-sans text-ink-3">Search subject, sender, recipient…</span>
          }
        >
          <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <For each={summary()}>
              {(part) => (
                <span class="truncate rounded-full bg-paper-3 px-2.5 py-0.5 font-sans text-xs text-ink-2">
                  {part}
                </span>
              )}
            </For>
          </span>
        </Show>
        <span
          class={`ml-auto shrink-0 font-mono text-xs text-ink-3 transition-transform ${
            expanded() ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      <Show when={expanded()}>
        <div class="animate-rise-in border-t border-ink/10 px-4 py-3">
          <div class="mb-3">
            <input
              type="text"
              value={props.params.q}
              placeholder="Search subject, sender, recipient…"
              onInput={(e) => props.onQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") props.onSubmit();
              }}
              class="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 font-sans text-ink placeholder:text-ink-3 focus:border-vermilion focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <For each={textFields}>
              {(f) => (
                <label class="flex flex-col gap-1">
                  <span class="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                    {f.label}
                  </span>
                  <input
                    type="text"
                    value={props.params[f.key]}
                    placeholder={f.placeholder}
                    onInput={(e) => props.onTextField(f.key, e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") props.onSubmit();
                    }}
                    class="rounded-lg border border-ink/15 bg-paper px-3 py-1.5 font-sans text-sm text-ink placeholder:text-ink-3 focus:border-vermilion focus:outline-none"
                  />
                </label>
              )}
            </For>
            <label class="flex flex-col gap-1">
              <span class="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                From date
              </span>
              <input
                type="date"
                value={unixToDate(props.params.since)}
                onInput={(e) => props.onSince(dateToUnix(e.currentTarget.value))}
                class="rounded-lg border border-ink/15 bg-paper px-3 py-1.5 font-sans text-sm text-ink focus:border-vermilion focus:outline-none"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                To date
              </span>
              <input
                type="date"
                value={unixToDate(props.params.until)}
                onInput={(e) => props.onUntil(dateToUnix(e.currentTarget.value))}
                class="rounded-lg border border-ink/15 bg-paper px-3 py-1.5 font-sans text-sm text-ink focus:border-vermilion focus:outline-none"
              />
            </label>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            {toggles.map((t) => {
              const active = props.toggles[t.key] === true;
              return (
                <button
                  onClick={() => props.onToggle(t.key)}
                  class={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-vermilion bg-vermilion text-paper"
                      : "border-ink/15 text-ink-2 hover:border-vermilion hover:text-vermilion"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>

          <div class="mt-4 flex items-center justify-between">
            <button
              onClick={props.onClear}
              class="rounded-lg border border-ink/20 px-4 py-1.5 font-sans text-sm text-ink-2 transition-colors hover:border-vermilion hover:text-vermilion"
            >
              Clear
            </button>
            <button
              onClick={props.onSubmit}
              class="rounded-lg bg-ink px-5 py-1.5 font-sans text-sm font-medium text-paper transition-colors hover:bg-vermilion"
            >
              Search
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
