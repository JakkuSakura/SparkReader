import { For, Show } from "solid-js";
import type { Message } from "../types";
import { formatDateShort, senderLabel } from "../format";

interface Props {
  messages: Message[];
  total: number;
  loading: boolean;
  selectedPk: number | null;
  onSelect: (pk: number) => void;
  onLoadMore: () => void;
}

function badges(m: Message): string[] {
  const out: string[] = [];
  if (m.starred) out.push("★");
  if (m.numberOfFileAttachments > 0) out.push("❒");
  if (m.snoozed) out.push("⏾");
  return out;
}

export default function MessageList(props: Props) {
  return (
    <div class="flex h-full flex-col overflow-hidden">
      <div class="flex items-center justify-between border-b border-ink/10 px-6 py-3">
        <span class="font-mono text-xs uppercase tracking-widest text-ink-3">
          {props.loading ? "Searching…" : `${props.total.toLocaleString()} results`}
        </span>
      </div>

      <Show
        when={props.messages.length > 0}
        fallback={
          <div class="flex flex-1 items-center justify-center p-10 text-center">
            <p class="font-display text-xl italic text-ink-3">
              {props.loading ? "Loading your archive…" : "No messages found."}
            </p>
          </div>
        }
      >
        <ul class="flex-1 divide-y divide-ink/10 overflow-y-auto">
          <For each={props.messages}>
            {(m, i) => (
              <li>
                <button
                  onClick={() => props.onSelect(m.pk)}
                  class={`animate-rise-in block w-full px-6 py-4 text-left transition-colors hover:bg-paper-3/60 ${
                    props.selectedPk === m.pk ? "bg-paper-3" : ""
                  }`}
                  style={{ "animation-delay": `${Math.min(i() * 20, 200)}ms` }}
                >
                  <div class="mb-1 flex items-baseline justify-between gap-3">
                    <span class="truncate font-mono text-xs text-ink-2">
                      {senderLabel(m)}
                    </span>
                    <span class="shrink-0 font-mono text-[11px] text-ink-3">
                      {formatDateShort(m.receivedDate)}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    {m.unseen === 1 && (
                      <span class="h-2 w-2 shrink-0 rounded-full bg-vermilion" />
                    )}
                    <span class="truncate font-display text-base font-medium text-ink">
                      {m.subject || "(no subject)"}
                    </span>
                    <span class="ml-auto flex shrink-0 gap-1 text-vermilion">
                      {badges(m).join(" ")}
                    </span>
                  </div>
                  <p class="mt-1 line-clamp-1 truncate text-sm text-ink-3">
                    {m.shortBody || ""}
                  </p>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>

      <Show when={props.messages.length > 0 && props.messages.length < props.total}>
        <div class="border-t border-ink/10 p-4 text-center">
          <button
            onClick={props.onLoadMore}
            disabled={props.loading}
            class="rounded-lg border border-ink/20 px-5 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-vermilion hover:text-vermilion disabled:opacity-50"
          >
            Load more
          </button>
        </div>
      </Show>
    </div>
  );
}
