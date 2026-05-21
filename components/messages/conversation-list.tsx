"use client";

import { formatDistanceToNowLocalized } from "@/lib/date-utils";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
  unreadCount: number;
}

interface ConversationListProps {
  searchQuery: string;
  onSelectChat: (id: number) => void;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    avatar: "/user.png",
    lastMessage: "That sounds great! See you tomorrow at 8am",
    lastMessageTime: new Date("2024-01-01T09:55:00Z"),
    unread: false,
    unreadCount: 0,
  },
  {
    id: 2,
    name: "HC Amsterdam Recruiting",
    avatar: "/user.png",
    lastMessage: "We received your application! Thanks for your interest.",
    lastMessageTime: new Date("2024-01-01T08:00:00Z"),
    unread: true,
    unreadCount: 2,
  },
  {
    id: 3,
    name: "Coach Mike",
    avatar: "/user.png",
    lastMessage: "Great performance in the last match!",
    lastMessageTime: new Date("2024-01-01T00:00:00Z"),
    unread: false,
    unreadCount: 0,
  },
  {
    id: 4,
    name: "Team Netherlands Players",
    avatar: "/user.png",
    lastMessage: "Practice moved to 7pm next Tuesday",
    lastMessageTime: new Date("2023-12-31T00:00:00Z"),
    unread: false,
    unreadCount: 0,
  },
];

export function ConversationList({
  searchQuery,
  onSelectChat,
}: ConversationListProps) {
  const t = useTranslations("messages");
  const locale = useLocale() as "en" | "es" | "fr";

  const conversations = MOCK_CONVERSATIONS;

  const filtered = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {filtered.length > 0 ? (
        <div className="divide-y divide-border mt-2">
          {filtered.map((conversation) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={conversation.id}
              onClick={() => onSelectChat(conversation.id)}
              className="w-full px-4 py-3 bg-background backdrop-blur-md hover:bg-input transition-colors duration-300 text-left flex items-center gap-3 border-b border-border last:border-b-0 cursor-pointer group"
            >
              <Image
                src={conversation.avatar || "/placeholder.svg"}
                alt={conversation.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p
                    className={`font-semibold text-foreground truncate ${
                      conversation.unread ? "font-bold" : ""
                    }`}
                  >
                    {conversation.name}
                  </p>
                  <span className="text-xs text-foreground shrink-0">
                    {formatDistanceToNowLocalized(
                      conversation.lastMessageTime,
                      locale,
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm truncate ${
                      conversation.unread
                        ? "text-foreground font-medium"
                        : "text-foreground-muted"
                    }`}
                  >
                    {conversation.lastMessage}
                  </p>
                  {conversation.unread && (
                    <span className="shrink-0 w-6 h-6 rounded-full bg-error text-background text-xs font-bold flex items-center justify-center shadow-md">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="opacity-0 group-hover:opacity-100 cursor-pointer p-2 hover:bg-error/10 hover:text-error border border-transparent hover:border-error rounded-lg text-foreground transition-colors"
              >
                <Trash2 size={18} />
              </span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-foreground text-lg text-center">
            {t("noConversationsFound")}
          </p>
        </div>
      )}
    </div>
  );
}
