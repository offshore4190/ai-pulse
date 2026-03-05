import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  // Store messages in memory for now (simple demo)
  const messages: any[] = [
    { id: 1, user: "System", text: "Welcome to Campus Voice! Share your AI insights here.", timestamp: new Date().toISOString() }
  ];

  wss.on("connection", (ws) => {
    console.log("Client connected");
    
    // Send existing messages to new client
    ws.send(JSON.stringify({ type: "init", data: messages }));

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "post") {
          const newMessage = {
            id: Date.now(),
            user: message.user || "Anonymous",
            text: message.text,
            timestamp: new Date().toISOString()
          };
          
          // Basic moderation: check for length
          if (newMessage.text.length > 0 && newMessage.text.length < 500) {
            messages.push(newMessage);
            // Keep only last 50 messages
            if (messages.length > 50) messages.shift();

            // Broadcast to all clients
            const broadcastData = JSON.stringify({ type: "new_message", data: newMessage });
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(broadcastData);
              }
            });
          }
        }
      } catch (e) {
        console.error("Error processing message:", e);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
