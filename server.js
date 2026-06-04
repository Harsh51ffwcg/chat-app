require("dotenv").config();

const express = require("express");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

// ===== TELEGRAM CONFIG =====
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// fetch fallback (Node compatibility)
const fetchFn =
    global.fetch ||
    ((...args) =>
        import("node-fetch").then(({ default: fetch }) => fetch(...args)));

// anti-spam control
let lastSent = 0;

// store usernames
const users = {};

async function sendTelegram(text) {
    try {
        const now = Date.now();
        if (now - lastSent < 2000) return;
        lastSent = now;

        await fetchFn(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text
            })
        });
    } catch (err) {
        console.log("Telegram error:", err.message);
    }
}

// static files
app.use(express.static("public"));

// allow big images (base64)
app.use(express.json({ limit: "10mb" }));

// Socket.IO
io.on("connection", (socket) => {
    console.log("User connected");

    // ask frontend for name
    socket.emit("ask-name");

    sendTelegram(`🟢 New connection: ${socket.id}`);

    // set username
    socket.on("set-name", (name) => {
        users[socket.id] = name || "Anonymous";

        sendTelegram(`👤 Joined: ${users[socket.id]}`);
    });

    // chat message handler
    socket.on("chat message", (data) => {
        const name = users[socket.id] || "Anonymous";

        const messageData = {
            name,
            text: data.text || "",
            image: data.image || null
        };

        io.emit("chat message", messageData);

        // Telegram text only
        if (data.text && typeof data.text === "string") {
            if (data.text.length <= 200) {
                sendTelegram(`💬 ${name}: ${data.text}`);
            }
        }

        // Telegram image notice
        if (data.image) {
            sendTelegram(`🖼 ${name} sent an image`);
        }
    });

    socket.on("disconnect", () => {
        const name = users[socket.id] || socket.id;

        sendTelegram(`🔴 Left: ${name}`);

        delete users[socket.id];
    });
});

// start server
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    sendTelegram(`🚀 Server started on port ${PORT}`);
});
