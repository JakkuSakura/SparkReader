import type { Account } from "../types";

interface Props {
  accounts: Account[];
  selectedAccount: number | null;
  onSelectAccount: (pk: number | null) => void;
}

export default function Sidebar(props: Props) {
  return (
    <aside class="flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-ink/10 bg-paper-2/60 p-5">
      <div>
        <h2 class="mb-3 font-mono text-xs font-medium uppercase tracking-widest text-ink-3">
          Accounts
        </h2>
        <ul class="flex flex-col gap-1">
          {props.accounts.map((a) => (
            <li>
              <button
                onClick={() => props.onSelectAccount(a.pk)}
                class={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  props.selectedAccount === a.pk
                    ? "bg-ink text-paper"
                    : "text-ink-2 hover:bg-paper-3"
                }`}
                title={a.accountTitle || a.ownerFullName || `Account ${a.pk}`}
              >
                {a.accountTitle || a.ownerFullName || `Account ${a.pk}`}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
