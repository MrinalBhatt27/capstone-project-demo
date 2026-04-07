import React, { useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const API_URL = "http://aea17c6ff31b94d1da34ae857b00e256-790266999.us-east-1.elb.amazonaws.com";
      console.log(API_URL);
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();

      const botMessage = { text: data.reply, sender: "bot" };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { text: "Error connecting to server ❌", sender: "bot" }
      ]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2>🤖 Cloud AI Chatbot</h2>

      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf:
                msg.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor:
                msg.sender === "user" ? "#007bff" : "#e5e5ea",
              color: msg.sender === "user" ? "white" : "black"
            }}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div style={styles.loading}>Bot is typing...</div>
        )}
      </div>

      <div style={styles.inputArea}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />

        <button style={styles.button} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "400px",
    margin: "50px auto",
    textAlign: "center",
    fontFamily: "Arial"
  },
  chatBox: {
    border: "1px solid #ccc",
    height: "400px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    marginBottom: "10px"
  },
  message: {
    padding: "10px",
    borderRadius: "10px",
    margin: "5px 0",
    maxWidth: "70%"
  },
  inputArea: {
    display: "flex"
  },
  input: {
    flex: 1,
    padding: "10px"
  },
  button: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none"
  },
  loading: {
    fontStyle: "italic",
    color: "gray"
  }
};

export default App;