const express = require("express");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

// ===== TELEGRAM CONFIG =====
const BOT_TOKEN = "8618884467:AAEdZ5XP-C_rPA1WeQNI3LUlu1fDRPFsLhQ";
const CHAT_ID = "8684919495";

// Telegram send function
async function sendTelegram(text) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text
            })
        });
    } catch (err) {
        console.log("Telegram error:", err.message);
    }
}

// Serve files from public folder
app.use(express.static("public"));

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("User connected");

    // 🔔 Notify you when someone joins
    sendTelegram(`🟢 User connected: ${socket.id}`);

    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);

        // 🔔 Notify you of messages
        sendTelegram(`💬 New message: ${msg}`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");

        // 🔴 Notify disconnect
        sendTelegram(`🔴 User disconnected: ${socket.id}`);
    });
});

// Railway/Render Port
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // 🔔 Startup alert
    sendTelegram(`🚀 Server started on port ${PORT}`);
});
