import { useState, useEffect } from "react";
import * as webllm from "@mlc-ai/web-llm";
import "./app.scss";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "You are a helpful assistant that can help me with my tasks.",
    },
  ]);
  const [engine, setEngine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const selectedModel = "Llama-3.2-3B-Instruct-q4f32_1-MLC";
    webllm
      .CreateMLCEngine(selectedModel, {
        initProgressCallback: (initProgress) => {
          console.log("Init progress: ", initProgress);
        },
      })
      .then((engine) => {
        setEngine(engine);
        setIsLoading(false);
      });
  }, []);

  async function sendMessageToLlm() {
    if (!engine || !input.trim()) return;

    const tempMessages = [...messages, { role: "user", content: input }];
    setMessages(tempMessages);
    setInput("");

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const completion = await engine.chat.completions.create({
      messages: tempMessages,
      stream: true,
    });

    for await (const chunk of completion) {
      const delta = chunk.choices[0].delta?.content || "";
      if (delta) {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: lastMsg.content + delta },
            ];
          } else {
            return [...prev, { role: "assistant", content: delta }];
          }
        });
      }
    }
  }

  return (
    <main>
      {/* 🔹 Navbar */}
      <div className="navbar">NOVA AI</div>

      <section>
        <div className="conversation-area">
          {isLoading ? (
            <div className="loading">🚀 Loading model, please wait...</div>
          ) : (
            <>
              <div className="messages">
                {messages
                  .filter((message) => message.role !== "system")
                  .map((message, index) => (
                    <div className={`message ${message.role}`} key={index}>
                      {message.content}
                    </div>
                  ))}
              </div>
              <div className="input-area">
                <input
                  onChange={(e) => setInput(e.target.value)}
                  value={input}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessageToLlm();
                    }
                  }}
                  type="text"
                  placeholder="Type your message here"
                />
                <button onClick={sendMessageToLlm}>Send</button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
