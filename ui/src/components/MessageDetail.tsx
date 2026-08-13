import { For, Show, createResource, createSignal } from "solid-js";
import type { Attachment, MessageDetail } from "../types";
import { formatDate, formatSize, senderLabel } from "../format";

interface Props {
  message: MessageDetail;
  onClose: () => void;
  onThread: (conversationPk: number) => void;
}

export default function MessageDetail(props: Props) {
  const [attachments] = createResource(
    () => props.message.pk,
    (pk) => fetch(`/messages/${pk}/attachments`).then((r) => r.json() as Promise<Attachment[]>),
  );
  const [showRaw, setShowRaw] = createSignal(false);

  return (
    <div class="animate-slide-in flex h-full flex-col overflow-hidden border-l border-ink/10 bg-paper">
      <header class="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-4">
        <div class="min-w-0">
          <h2 class="font-display text-xl font-semibold leading-snug text-ink">
            {props.message.subject || "(no subject)"}
          </h2>
          <p class="mt-1 font-mono text-xs text-ink-2">
            {senderLabel(props.message)} · {formatDate(props.message.receivedDate)}
          </p>
          <Show when={props.message.messageTo}>
            <p class="mt-0.5 font-mono text-xs text-ink-3">to: {props.message.messageTo}</p>
          </Show>
        </div>
        <div class="flex shrink-0 gap-2">
          <button
            onClick={() => props.onThread(props.message.conversationPk)}
            class="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-vermilion hover:text-vermilion"
          >
            Thread
          </button>
          <button
            onClick={() => setShowRaw((v) => !v)}
            class="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-vermilion hover:text-vermilion"
          >
            {showRaw() ? "Rendered" : "HTML"}
          </button>
          <button
            onClick={props.onClose}
            class="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-vermilion"
          >
            Close
          </button>
        </div>
      </header>

      <Show when={attachments()?.length}>
        <div class="flex flex-wrap gap-2 border-b border-ink/10 px-6 py-3">
          <For each={attachments()!}>
            {(a) => (
              <span class="rounded-full border border-ink/15 px-3 py-1 font-mono text-xs text-ink-2">
                {a.attachmentName || "attachment"} · {formatSize(a.attachmentSize)}
              </span>
            )}
          </For>
        </div>
      </Show>

      <div class="flex-1 overflow-auto px-6 py-5">
        <Show
          when={props.message.bodyHtml}
          fallback={<p class="font-display italic text-ink-3">No cached body for this message.</p>}
        >
          <Show when={showRaw()}>
            <pre class="whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-2">
              {props.message.bodyHtml}
            </pre>
          </Show>
          <Show when={!showRaw()}>
            <div
              class="mail-body text-sm leading-relaxed text-ink"
              innerHTML={props.message.bodyHtml!}
            />
          </Show>
        </Show>
      </div>
    </div>
  );
}
