import React, { useState, useEffect, useRef } from "react";
import { T, ROLE_COLORS } from "../../assets/styles/theme";
import { request } from "../../api/auth";

// Role-specific config
const ROLE_CONFIGS = {
  student: {
    title: "Student Academic AI",
    icon: "🎓",
    color: "#06B6D4",
    greeting: "Hi there! I am your ZenelaitLMS Student Academic Agent. Ask me anything about your timetables, assignments, attendance percentage, or for coding and curriculum help!",
    suggestions: [
      "Show my attendance percentage",
      "Explain Java inheritance simply",
      "What are my current assignment grades?"
    ]
  },
  parent: {
    title: "Parent Companion AI",
    icon: "👶",
    color: "#EF4444",
    greeting: "Welcome! As your Parent AI Companion, I am here to help you track your child's learning journey, fee invoices, and daily schedule.",
    suggestions: [
      "How is my child performing academically?",
      "Show my child's attendance percentage",
      "What are the pending fees for my child?"
    ]
  },
  teacher: {
    title: "AI Teaching Assistant",
    icon: "📝",
    color: "#10B981",
    greeting: "Hello Professor! I am your AI Teaching Assistant here to decrease preparation time. Let me generate MCQs or curate a structured lesson plan for your classes.",
    suggestions: [
      "Generate 10 Java MCQs for exam preparation",
      "Create a 4-week lesson plan for OOP concepts",
      "Summarize my weekly classroom schedules"
    ]
  },
  admin: {
    title: "Automation & Analytics Agent",
    icon: "🤖",
    color: "#7C3AED",
    greeting: "Greetings Admin! I am your LMS Automation and Business Intelligence Agent. Ask me about system analytics, platform revenue, and low-effort operations management.",
    suggestions: [
      "Show platform revenue and invoice insights",
      "How can I use AI agents to automate daily operations?",
      "Summarize batch and student enrollment statistics"
    ]
  },
  superadmin: {
    title: "HQ System Automation AI",
    icon: "🛡️",
    color: "#F59E0B",
    greeting: "Welcome Super Admin! I am your Platform HQ System Operations Agent. Ask me about auditing logs, platform statistics, or automated analytics.",
    suggestions: [
      "Show platform revenue and invoice insights",
      "How can I use AI agents to automate daily operations?"
    ]
  }
};

export const AiAgent = ({ role }) => {
  const activeRole = role?.toLowerCase() || "student";
  const cfg = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.student;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Initialize greeting on load or when role changes
  useEffect(() => {
    setMessages([
      { sender: "ai", text: cfg.greeting, timestamp: new Date() }
    ]);
  }, [activeRole]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const msgText = textToSend || input;
    if (!msgText.trim()) return;

    if (!textToSend) {
      setInput("");
    }

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: msgText, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await request("/ai/chat", {
        method: "POST",
        // headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText })
      });

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: response.reply || "I didn't receive a reply from the agent.", timestamp: new Date() }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Server is compiling or database is offline. Please make sure the backend is fully loaded!", timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format responses to render simple markdown and java code blocks nicely
  const formatText = (text) => {
    if (!text) return "";
    
    // Handle code blocks (e.g. ```java ... ```)
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const lines = part.split("\n");
        const codeLines = lines.slice(1, lines.length - 1).join("\n");
        return (
          <pre
            key={index}
            style={{
              background: "#0c0a18",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "Courier New, monospace",
              overflowX: "auto",
              color: "#a78bfa",
              margin: "8px 0",
              whiteSpace: "pre-wrap"
            }}
          >
            <code>{codeLines}</code>
          </pre>
        );
      }

      // Handle simple markdown-style bold tags (**bold**)
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {boldParts.map((bp, bidx) => {
            if (bp.startsWith("**") && bp.endsWith("**")) {
              return <strong key={bidx} style={{ color: "#fff", fontWeight: 700 }}>{bp.slice(2, -2)}</strong>;
            }
            // Handle bullet points
            const bullets = bp.split("\n");
            return bullets.map((line, lidx) => (
              <span key={lidx}>
                {line.startsWith("* ") ? `• ${line.slice(2)}` : line}
                {lidx < bullets.length - 1 && <br />}
              </span>
            ));
          })}
        </span>
      );
    });
  };

  return (
    <>
      {/* 🚀 FLOAT TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: `linear-gradient(135deg, ${cfg.color}, #7C3AED)`,
          border: "none",
          cursor: "pointer",
          boxShadow: `0 8px 24px rgba(124, 58, 237, 0.4)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: "#fff",
          zIndex: 999,
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isOpen ? "rotate(45deg) scale(0.9)" : "scale(1)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = isOpen ? "rotate(45deg) scale(0.95)" : "scale(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = isOpen ? "rotate(45deg) scale(0.9)" : "scale(1)"; }}
      >
        {isOpen ? "✕" : cfg.icon}
      </button>

      {/* 🤖 CHAT WINDOW DRAWER */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: 380,
            height: 520,
            borderRadius: 16,
            background: "rgba(10, 8, 20, 0.85)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            overflow: "hidden",
            fontFamily: "Inter, sans-serif"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: `linear-gradient(90deg, ${cfg.color}15, transparent)`,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: `${cfg.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: cfg.color
              }}
            >
              {cfg.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                ZenelaitLMS AI Agent
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "#10B981", display: "inline-block" }}></span>
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{cfg.title}</div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            {messages.map((m, idx) => {
              const isAi = m.sender === "ai";
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isAi ? "flex-start" : "flex-end",
                    maxWidth: "85%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isAi ? "flex-start" : "flex-end"
                  }}
                >
                  <div
                    style={{
                      background: isAi ? "rgba(255, 255, 255, 0.04)" : cfg.color,
                      border: isAi ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
                      padding: "10px 14px",
                      borderRadius: isAi ? "0px 12px 12px 12px" : "12px 12px 0px 12px",
                      color: isAi ? T.text : "#fff",
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      wordBreak: "break-word"
                    }}
                  >
                    {formatText(m.text)}
                  </div>
                  <span style={{ fontSize: 9, color: T.muted, marginTop: 4, padding: "0 4px" }}>
                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ alignSelf: "flex-start", display: "flex", gap: 4, padding: "10px 14px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "0px 12px 12px 12px" }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: cfg.color, display: "inline-block", animation: "pulse 1.2s infinite ease-in-out" }}></span>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: cfg.color, display: "inline-block", animation: "pulse 1.2s infinite ease-in-out 0.2s" }}></span>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: cfg.color, display: "inline-block", animation: "pulse 1.2s infinite ease-in-out 0.4s" }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestions */}
          <div style={{ padding: "0 20px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {cfg.suggestions.map((s, sidx) => (
              <button
                key={sidx}
                onClick={() => handleSend(s)}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: 12,
                  padding: "5px 10px",
                  fontSize: 10,
                  color: cfg.color,
                  cursor: "pointer",
                  transition: "all .2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${cfg.color}15`;
                  e.currentTarget.style.borderColor = cfg.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                }}
              >
                💡 {s}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: "12px 20px",
              background: "#080612",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: 8,
              alignItems: "center"
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ZenelaitLMS AI Agent...`}
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 12,
                outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                background: cfg.color,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              ➔
            </button>
          </form>
        </div>
      )}

      {/* Dynamic Keyframe style injector for pulsing loader */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
};
