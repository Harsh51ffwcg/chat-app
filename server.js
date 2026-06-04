const express = require("express");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

// ===== TELEGRAM CONFIG (DIRECT) =====
const BOT_TOKEN = "8618884467:AAEdZ5XP-C_rPA1WeQNI3LUlu1fDRPFsLhQ";
const CHAT_ID = "8684919495";

// anti-spam control
let lastSent = 0;

// store usernames
const users = {};

// simple Telegram sender (NO fetch fallback mess)
async function sendTelegram(text) {
    try {
        const now = Date.now();
        if (now - lastSent < 2000) return;
        lastSent = now;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
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

// allow large images (base64)
app.use(express.json({ limit: "10mb" }));

// Socket.IO
io.on("connection", (socket) => {
    console.log("User connected");

    socket.emit("ask-name");

    sendTelegram(`🟢 Connected: ${socket.id}`);

    socket.on("set-name", (name) => {
        users[socket.id] = name || "Anonymous";
        sendTelegram(`👤 Joined: ${users[socket.id]}`);
    });

    socket.on("chat message", (data) => {
        const name = users[socket.id] || "Anonymous";

        const messageData = {
            name,
            text: data.text || "",
            image: data.image || null
        };

        io.emit("chat message", messageData);

        if (data.text && data.text.length <= 200) {
            sendTelegram(`💬 ${name}: ${data.text}`);
        }

        if (data.image) {
            sendTelegram(`🖼 ${name} sent an image`);
        }
    });

    socket.on("disconnect", () => {
        const name = users[socket.id] || "Anonymous";

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
