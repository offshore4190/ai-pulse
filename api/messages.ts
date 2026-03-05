import type { VercelRequest, VercelResponse } from "@vercel/node";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

// In-memory store — resets on cold start, sufficient for demo
const messages: Message[] = [
  {
    id: "1",
    user: "System",
    text: "Welcome to Campus Voice! Share your AI insights here.",
    timestamp: new Date().toISOString(),
  },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const since = req.query.since ? String(req.query.since) : null;
    const result = since
      ? messages.filter((m) => m.timestamp > since)
      : messages.slice(-50);
    return res.status(200).json(result);
  }

  if (req.method === "POST") {
    const { user, text } = req.body as { user?: string; text?: string };

    if (!text || text.trim().length === 0 || text.trim().length > 500) {
      return res.status(400).json({ error: "Invalid message" });
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      user: (user || "Anonymous").slice(0, 30),
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    messages.push(newMessage);
    if (messages.length > 50) messages.shift();

    return res.status(201).json(newMessage);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
