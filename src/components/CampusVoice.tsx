import { useState, useEffect, useRef } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { TranslationKeys, Language, CampusVoiceMessage } from "../types";

interface Props {
  t: TranslationKeys;
  language: Language;
}

const API_BASE = "/api/messages";
const POLL_INTERVAL = 5000;

export default function CampusVoice({ t }: Props) {
  const [messages, setMessages] = useState<CampusVoiceMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const lastTimestamp = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (isInit = false) => {
    try {
      const url = isInit
        ? API_BASE
        : `${API_BASE}${lastTimestamp.current ? `?since=${encodeURIComponent(lastTimestamp.current)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: CampusVoiceMessage[] = await res.json();
      if (data.length > 0) {
        if (isInit) {
          setMessages(data);
        } else {
          setMessages((prev) => [...prev, ...data]);
        }
        lastTimestamp.current = data[data.length - 1].timestamp;
      }
    } catch {
      // silently fail on poll errors
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePost = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: username.trim() || t.anonymous,
          text: inputText.trim(),
        }),
      });
      if (res.ok) {
        const newMsg: CampusVoiceMessage = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        lastTimestamp.current = newMsg.timestamp;
        setInputText("");
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-black/5 bg-purple-50/30 flex items-center justify-between">
        <div>
          <h3 className="font-bold flex items-center gap-2 text-purple-900">
            <ShieldCheck size={18} className="text-purple-500" />
            {t.campusVoice}
          </h3>
          <p className="text-xs text-purple-600/70 mt-0.5">{t.campusVoiceDesc}</p>
        </div>
        <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
          {t.live}
        </span>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-[10px] font-bold flex-shrink-0">
                {(msg.user || "A").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-gray-700">{msg.user}</span>
              <span className="text-[10px] text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed pl-8">{msg.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-black/5 space-y-2">
        <p className="text-[10px] text-gray-400 flex items-center gap-1">
          <ShieldCheck size={10} />
          {t.complianceNotice}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t.anonymous}
            className="w-24 px-3 py-2 text-xs bg-black/5 rounded-xl border-0 focus:ring-2 focus:ring-purple-400 outline-none flex-shrink-0"
            maxLength={20}
          />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.sharePlaceholder}
            className="flex-1 px-3 py-2 text-xs bg-black/5 rounded-xl border-0 focus:ring-2 focus:ring-purple-400 outline-none"
            maxLength={500}
          />
          <button
            onClick={handlePost}
            disabled={!inputText.trim() || sending}
            className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-200 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
