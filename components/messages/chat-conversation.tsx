"use client";

import { useState } from "react";
import { ArrowLeft, Send, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "../ui/input";
import { useTranslations } from "next-intl";

interface ChatMessage {
  id: number;
  sender: "user" | "other";
  text: string;
  timestamp: Date;
}

interface ChatConversationProps {
  conversationId: number;
  onBack: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    sender: "other",
    text: "Hey! How are you doing?",
    timestamp: new Date("2024-01-01T09:50:00Z"),
  },
  {
    id: 2,
    sender: "user",
    text: "Great! Just finished training",
    timestamp: new Date("2024-01-01T09:52:00Z"),
  },
  {
    id: 3,
    sender: "other",
    text: "That sounds great! See you tomorrow at 8am",
    timestamp: new Date("2024-01-01T09:55:00Z"),
  },
];

export function ChatConversation({ onBack }: ChatConversationProps) {
  const t = useTranslations("messages");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: "user",
          text: newMessage,
          timestamp: new Date(),
        },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-background-gradient ">
      <div className="sticky top-16 bg-background border-b border-border px-4 py-3 flex items-center gap-3 z-20 shadow-sm">
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          onClick={onBack}
          className="p-2 rounded-lg cursor-pointer"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </motion.button>
        <motion.img
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          src="/user.png"
          alt="Conversation"
          className="w-10 h-10 rounded-full object-cover cursor-pointer"
        />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Sarah Mitchell</p>
          <p className="text-xs text-foreground-muted">{t("activeNow")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scroll-smooth">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-3 rounded-2xl ${
                msg.sender === "user"
                  ? "bg-background text-foreground rounded-br-none shadow-md border border-border-strong hover:shadow-lg"
                  : "bg-input border border-border-strong text-foreground rounded-bl-none shadow-sm hover:shadow-md"
              }`}
            >
              <p className="text-sm wrap-break-word">{msg.text}</p>
              <p className="text-xs mt-2 text-foreground-muted">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-border bg-background px-6 pt-8 pb-12 flex items-center gap-2 shadow-lg">
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="p-2 cursor-pointer shrink-0 text-foreground mr-2"
        >
          <Plus size={24} />
        </motion.button>
        <Input
          type="text"
          placeholder={t("typeMessage")}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 pl-4"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="p-2 rounded-lg disabled:cursor-not-allowed cursor-pointer shrink-0 ml-2"
        >
          <Send size={20} className="text-foreground" />
        </motion.button>
      </div>
    </div>
  );
}
