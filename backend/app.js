require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PORT = 3000;

app.post("/chat", async (req, res) => {

  console.log("FINAL TEST LOG");
  console.error("FINAL ERROR TEST");
  try {
    const userMessage = req.body.message;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

  const result = await model.generateContent({
                              contents: [
                                {
                                  parts: [{ text: userMessage }]
                                }
                              ]
                            });
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("Gemini Error:", error.message);

    // fallback response (important for demo)
    res.json({
      reply: "AI service temporarily unavailable 🤖"
    });
  }
});

// Health check

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`Gemini Chatbot running on port ${PORT}`);
});