import { For, Show, createEffect, createResource, createSignal } from "solid-js";
import SearchBar, {
  emptyParams,
  type SearchParams,
  type TextField,
  type ToggleKey,
} from "./components/SearchBar";
import Sidebar from "./components/Sidebar";
import MessageList from "./components/MessageList";
import MessageDetail from "./components/MessageDetail";
import { getAccounts, getConversationMessages, getMessage, searchMessages } from "./api";
import { senderLabel } from "./format";
import type { Message, MessageDetail as MessageDetailType } from "./types";

const LIMIT = 50;

function buildParams(p: SearchParams, offset: number): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = { limit: LIMIT, offset };
  if (p.q) out.q = p.q;
  if (p.account !== null) out.account = p.account;
  if (p.from) out.from = p.from;
  if (p.fromExact) out.fromExact = p.fromExact;
  if (p.fromDomain) out.fromDomain = p.fromDomain;
  if (p.to) out.to = p.to;
  if (p.subject) out.subject = p.subject;
  if (p.body) out.body = p.body;
  if (p.since !== null) out.since = p.since;
  if (p.until !== null) out.until = p.until;
  if (p.starred !== null) out.starred = p.starred;
  if (p.unseen !== null) out.unseen = p.unseen;
  if (p.inInbox !== null) out.inInbox = p.inInbox;
  if (p.inSent !== null) out.inSent = p.inSent;
  if (p.inDrafts !== null) out.inDrafts = p.inDrafts;
  if (p.snoozed !== null) out.snoozed = p.snoozed;
  if (p.hasAttachments !== null) out.has_attachments = p.hasAttachments;
  return out;
}

export default function App() {
  const [accounts] = createResource(getAccounts);
  const [params, setParams] = createSignal<SearchParams>({ ...emptyParams });
  const [committed, setCommitted] = createSignal<SearchParams>({ ...emptyParams });
  const [results, setResults] = createSignal<Message[]>([]);
  const [total, setTotal] = createSignal(0);
  const [loading, setLoading] = createSignal(false);
  const [selectedPk, setSelectedPk] = createSignal<number | null>(null);
  const [selected, setSelected] = createSignal<MessageDetailType | null>(null);
  const [thread, setThread] = createSignal<MessageDetailType[]>([]);

  createEffect(() => {
    const pk = selectedPk();
    if (pk === null) {
      setSelected(null);
      return;
    }
    getMessage(pk)
      .then(setSelected)
      .catch((e) => console.error(e));
  });

  async function runSearch(reset: boolean) {
    const p = committed();
    setLoading(true);
    try {
      const offset = reset ? 0 : results().length;
      const resp = await searchMessages(buildParams(p, offset));
      setTotal(resp.total);
      setResults(reset ? resp.results : [...results(), ...resp.results]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  createEffect(() => {
    // re-run whenever committed filters change
    committed();
    void runSearch(true);
  });

  function commit() {
    setCommitted({ ...params() });
  }

  function clear() {
    const next = { ...emptyParams };
    setParams(next);
    setCommitted({ ...next });
  }

  function toggle(key: ToggleKey) {
    const cur = params()[key];
    const next = {
      ...params(),
      [key]: cur === true ? null : true,
    };
    setParams(next);
    setCommitted({ ...next });
  }

  function setTextField(key: TextField, value: string) {
    setParams({ ...params(), [key]: value });
  }

  function setSince(value: number | null) {
    setParams({ ...params(), since: value });
  }

  function setUntil(value: number | null) {
    setParams({ ...params(), until: value });
  }

  function selectAccount(pk: number | null) {
    const next = { ...params(), account: pk };
    setParams(next);
    setCommitted({ ...next });
  }

  function showThread(conversationPk: number) {
    getConversationMessages(conversationPk)
      .then((msgs) => {
        setThread(msgs);
        setSelectedPk(null);
        setSelected(null);
      })
      .catch((e) => console.error(e));
  }

  function backToResults() {
    setThread([]);
  }

  return (
    <div class="flex h-screen overflow-hidden">
      <Sidebar
        accounts={accounts() ?? []}
        selectedAccount={params().account}
        onSelectAccount={selectAccount}
      />

      <main class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-4">
          <div class="shrink-0">
            <h1 class="font-display text-2xl font-bold tracking-tight text-ink">
              Spark<span class="text-vermilion">Reader</span>
            </h1>
            <p class="font-mono text-xs text-ink-3">local mail archive</p>
          </div>
          <div class="min-w-0 flex-1">
            <SearchBar
              params={params()}
              toggles={{
                starred: params().starred,
                unseen: params().unseen,
                inInbox: params().inInbox,
                inSent: params().inSent,
                inDrafts: params().inDrafts,
                snoozed: params().snoozed,
                hasAttachments: params().hasAttachments,
              }}
              onQuery={(q) => setParams({ ...params(), q })}
              onTextField={setTextField}
              onSince={setSince}
              onUntil={setUntil}
              onToggle={toggle}
              onSubmit={commit}
              onClear={clear}
            />
          </div>
        </header>

        <div class="flex min-h-0 flex-1">
          <section class="min-w-0 flex-1">
            <Show
              when={thread().length === 0}
              fallback={
                <div class="flex h-full flex-col">
                  <div class="border-b border-ink/10 px-6 py-3">
                    <button
                      onClick={backToResults}
                      class="font-mono text-xs uppercase tracking-widest text-vermilion hover:underline"
                    >
                      ← Back to results
                    </button>
                  </div>
                  <ul class="flex-1 divide-y divide-ink/10 overflow-y-auto">
                    <For each={thread()}>
                      {(m) => (
                        <li class="px-6 py-4">
                          <p class="font-mono text-xs text-ink-2">{senderLabel(m)}</p>
                          <p class="mt-1 text-sm text-ink">{m.shortBody || m.subject}</p>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              }
            >
              <MessageList
                messages={results()}
                total={total()}
                loading={loading()}
                selectedPk={selectedPk()}
                onSelect={setSelectedPk}
                onLoadMore={() => runSearch(false)}
              />
            </Show>
          </section>

          <Show when={selected()}>
            <section class="w-[46%] min-w-[420px]">
              <MessageDetail
                message={selected()!}
                onClose={() => setSelectedPk(null)}
                onThread={showThread}
              />
            </section>
          </Show>
        </div>
      </main>
    </div>
  );
}
