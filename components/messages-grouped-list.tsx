"use client";

import Link from "next/link";
import type { ActivityConversationGroup } from "@/lib/group-conversations";
import { Avatar } from "@/components/ui/avatar";
import { UnreadCountBadge } from "@/components/unread-count-badge";

type MessagesGroupedListProps = {
  groups: ActivityConversationGroup[];
  onOpenChat: (conversationId: string) => void;
};

export function MessagesGroupedList({
  groups,
  onOpenChat,
}: MessagesGroupedListProps) {
  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const groupUnread = group.conversations.reduce(
          (sum, c) => sum + c.unread_count,
          0,
        );

        return (
          <section key={group.activity_id} className="border-hairline bg-surface">
            <header className="flex flex-wrap items-center justify-between gap-2 border-hairline-b px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="type-eyebrow text-accent">Plan</p>
                <Link
                  href={`/activity/${group.activity_id}`}
                  className="font-display text-lg text-ink hover:text-accent"
                >
                  {group.activity_title}
                </Link>
              </div>
              {groupUnread > 0 ? (
                <UnreadCountBadge count={groupUnread} />
              ) : null}
            </header>

            <ul>
              {group.conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onOpenChat(c.id)}
                    className="flex w-full items-center gap-3 border-hairline-b px-4 py-4 text-left transition-colors hover:bg-background sm:px-5"
                  >
                    <Link
                      href={`/profile?userId=${c.other_user_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                      aria-label={`View @${c.other_username}'s profile`}
                    >
                      <Avatar
                        src={c.other_avatar_url}
                        name={c.other_username}
                        size="md"
                      />
                    </Link>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/profile?userId=${c.other_user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate text-sm font-medium text-ink hover:text-accent"
                      >
                        @{c.other_username}
                      </Link>
                      <span className="block text-xs text-muted">
                        Tap to open chat
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {c.unread_count > 0 ? (
                        <UnreadCountBadge count={c.unread_count} />
                      ) : null}
                      <span className="text-xs text-muted tabular-nums">
                        {new Date(c.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
