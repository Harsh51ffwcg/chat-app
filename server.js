const express = require("express");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Serve files from public folder
app.use(express.static("public"));

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// Railway/Render Port
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});