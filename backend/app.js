require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pool } = require("pg");

// 🔹 Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Database connection (RDS)
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "chatbotdb",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// 🔹 Mask IP function
function maskIP(ip) {
  if (!ip) return "unknown";

  // handle IPv6 (::ffff:192.168.x.x)
  if (ip.includes(":")) {
    ip = ip.split(":").pop();
  }

  const parts = ip.split(".");
  if (parts.length < 2) return ip;

  return `${parts[0]}.${parts[1]}.xxx.xxx`;
}

const PORT = 3000;

// 🔹 Chat API
app.post("/chat", async (req, res) => {
  console.log("Request received");

  try {
    const userMessage = req.body.message;
    const prompt = `You are a professional AI assistant for Ideal Software, a cloud solutions company.

Rules:
- Always respond in a professional and helpful tone
- Focus on cloud computing, DevOps, and enterprise software
- Keep answers clear and concise
- Avoid mentioning Google, Gemini, or AI models
- Answer as if you are part of Ideal Software support team

User Question:
${userMessage}
`;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });

    const response = await result.response;
    const text = response.text();

    // 🔥 Get real IP (important for LoadBalancer/EKS)
    const rawIP =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const maskedIP = maskIP(rawIP);

    console.log("Masked IP:", maskedIP);

    // 🔥 Save to DB
    await pool.query(
      "INSERT INTO messages (message, response, ip_address) VALUES ($1, $2, $3)",
      [userMessage, text, maskedIP]
    );

    res.json({ reply: text });

  } catch (error) {
    console.error("Error:", error.message);

    res.json({
      reply: "AI service temporarily unavailable 🤖",
    });
  }
});

// 🔹 Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`Gemini Chatbot running on port ${PORT}`);
});

app.get("/history", async (req, res) => {
  try {
    // 🔹 Get user IP
    const rawIP =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    const maskedIP = maskIP(rawIP);

    console.log("Fetching history for IP:", maskedIP);

    // 🔹 Fetch only this user's chats
    const result = await pool.query(
      "SELECT * FROM messages WHERE ip_address = $1 ORDER BY created_at DESC LIMIT 20",
      [maskedIP]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("History Error:", error.message);

    res.status(500).json({
      error: "Failed to fetch chat history"
    });
  }
});