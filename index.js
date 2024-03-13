// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const fs = require("fs");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

let studentStatus = {};

app.use(express.json());

// Configure CORS
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow GET and POST requests
    allowedHeaders: ["Content-Type", "Authorization"], // Allow Content-Type and Authorization headers
  })
);

app.post("/status", (req, res) => {
  const { studentId, status } = req.body;
  studentStatus[studentId] = { status, lastPing: Date.now() };
  io.emit("statusUpdate", studentStatus);
  res.sendStatus(200);
});

app.get("/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = `${__dirname}/public/${filename}.html`;
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.sendStatus(404);
  }
});

app.post("/ping", (req, res) => {
  const { studentId } = req.body;
  if (studentStatus[studentId]) {
    studentStatus[studentId].lastPing = Date.now();
  }
  res.sendStatus(200);
});

io.on("connection", (socket) => {
  socket.emit("statusUpdate", studentStatus);
});

// Check for inactive students every 5 seconds
setInterval(() => {
  const now = Date.now();
  for (const studentId in studentStatus) {
    if (now - studentStatus[studentId].lastPing > 5000) { // 5000 ms = 5 seconds
      delete studentStatus[studentId];
    }
  }
  io.emit("statusUpdate", studentStatus);
}, 5000);

server.listen(3000, () => console.log("Server listening on port 3000"));


 module.exports = app;