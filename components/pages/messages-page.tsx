"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { ChatConversation } from "@/components/messages/chat-conversation";
import { ConversationList } from "@/components/messages/conversation-list";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function MessagesPage() {
  const t = useTranslations("messages");
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (activeChat !== null) {
    return (
      <ChatConversation
        conversationId={activeChat}
        onBack={() => setActiveChat(null)}
      />
    );
  }

  return (
    <main className="max-w-lg mx-auto h-[calc(100dvh-120px)] flex flex-col">
      <div className="sticky top-16 bg-background z-20 px-4 py-4 border-b border-border-strong rounded-b-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
              size={18}
            />
            <Input
              type="text"
              placeholder={t("searchConversations")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="p-2"
          >
            <Plus size={24} className="text-foreground" />
          </motion.button>
        </div>
      </div>

      <ConversationList
        searchQuery={searchQuery}
        onSelectChat={setActiveChat}
      />
    </main>
  );
}
