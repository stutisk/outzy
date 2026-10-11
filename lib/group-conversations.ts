import type { ConversationListItem } from "@/lib/chat";

export type ActivityConversationGroup = {
  activity_id: string;
  activity_title: string;
  conversations: ConversationListItem[];
};

export function groupConversationsByActivity(
  items: ConversationListItem[],
): ActivityConversationGroup[] {
  const order: string[] = [];
  const map = new Map<string, ActivityConversationGroup>();

  for (const item of items) {
    let group = map.get(item.activity_id);
    if (!group) {
      group = {
        activity_id: item.activity_id,
        activity_title: item.activity_title,
        conversations: [],
      };
      map.set(item.activity_id, group);
      order.push(item.activity_id);
    }
    group.conversations.push(item);
  }

  return order.map((id) => map.get(id)!);
}
