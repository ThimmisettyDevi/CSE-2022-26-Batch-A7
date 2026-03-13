// src/components/ChatBot.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  FiMessageCircle,
  FiX,
  FiSun,
  FiMoon,
  FiMic,
  FiMicOff,
  FiUpload,
  FiBriefcase
} from "react-icons/fi";

import { GoogleGenerativeAI } from "@google/generative-ai";
import toast from "react-hot-toast";

const ChatBot = () => {

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // GEMINI API
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const systemPrompt = `
You are InternXpert AI.

You help users of the InternXpert platform.

Help students:
• Find internships
• Apply for internships
• Upload resumes
• Track applications

Help companies:
• Post internships
• Review student profiles
• Verify candidates

Always respond clearly and helpfully.
`;

  const quickQuestions = [
    "How do I find internships?",
    "How do I apply for internships?",
    "How can I upload my resume?",
    "How do I track my applications?"
  ];

  // AUTO SCROLL
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // SPEECH RECOGNITION
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        setChatInput(event.results[0][0].transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleSend = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { from: "user", text: chatInput };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setLoading(true);

    try {
      const prompt = `${systemPrompt}
      
User Question: ${chatInput}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setMessages((prev) => [...prev, { from: "bot", text }]);
    } catch (err) {
      console.error(err);
      toast.error("AI connection failed");
    }

    setLoading(false);
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleDark = () => {
    const mode = !darkMode;
    setDarkMode(mode);
    localStorage.setItem("darkMode", mode);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">

      {isOpen ? (

        <div className="w-[380px] h-[520px] bg-white shadow-2xl rounded-2xl flex flex-col border">

          {/* HEADER */}
          <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-3 rounded-t-2xl">

            <div>
              <h2 className="font-bold">InternXpert AI</h2>
              <p className="text-xs">Your Internship Assistant</p>
            </div>

            <div className="flex gap-2">

              <button onClick={toggleDark}>
                {darkMode ? <FiSun /> : <FiMoon />}
              </button>

              <button onClick={() => setIsOpen(false)}>
                <FiX />
              </button>

            </div>

          </div>

          {/* QUICK QUESTIONS */}
          <div className="p-3 flex flex-wrap gap-2 border-b">

            {quickQuestions.map((q, i) => (

              <button
                key={i}
                onClick={() => setChatInput(q)}
                className="text-xs bg-blue-100 px-3 py-1 rounded-full"
              >
                {q}
              </button>

            ))}

          </div>

          {/* CHAT AREA */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >

            {messages.length === 0 && (

              <div className="text-center text-gray-500">

                <FiBriefcase size={40} className="mx-auto mb-2" />

                <p className="font-semibold">
                  Welcome to InternXpert AI
                </p>

                <p className="text-sm">
                  Ask me about internships, resumes or applications.
                </p>

              </div>

            )}

            {messages.map((msg, i) => (

              <div
                key={i}
                className={`flex ${
                  msg.from === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div
                  className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
                    msg.from === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>

              </div>

            ))}

            {loading && (
              <p className="text-sm text-gray-500">
                AI is thinking...
              </p>
            )}

          </div>

          {/* INPUT */}
          <div className="p-3 border-t flex gap-2">

            <button onClick={() => fileInputRef.current.click()}>
              <FiUpload />
            </button>

            <button onClick={toggleVoice}>
              {isListening ? <FiMicOff /> : <FiMic />}
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleSend()
              }
              placeholder="Ask about internships..."
              className="flex-1 border rounded px-3 py-2 text-sm"
            />

            <button
              onClick={handleSend}
              className="bg-blue-500 text-white px-4 rounded"
            >
              Send
            </button>

            <input
              type="file"
              ref={fileInputRef}
              hidden
            />

          </div>

        </div>

      ) : (

        <button
          className="bg-blue-600 text-white p-4 rounded-full shadow-xl"
          onClick={() => setIsOpen(true)}
        >
          <FiMessageCircle size={26} />
        </button>

      )}

    </div>
  );
};

export default ChatBot;