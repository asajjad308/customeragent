'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [botName, setBotName] = useState('SupportAI');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful customer support assistant for an online store. Be friendly and concise.');
  const [greeting, setGreeting] = useState('Hello! How can I help you today?');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: greeting }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, systemPrompt }),
      });
      const data = await response.json();
      if (data.reply) {
        const assistantMessage: Message = { role: 'assistant', content: data.reply };
        setMessages([...newMessages, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, something went wrong.' };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickReplies = ['What are your hours?', 'How do I return an item?', 'Do you offer discounts?'];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white p-4 shadow">
        <h1 className="text-xl font-bold">{botName}</h1>
        <div className="mt-2 space-y-2">
          <input
            type="text"
            placeholder="Bot Name"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="System Prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-2 border rounded"
            rows={2}
          />
          <input
            type="text"
            placeholder="Greeting"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-white p-4 border-t">
        <div className="flex space-x-2 mb-2">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(reply)}
              className="px-3 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300"
            >
              {reply}
            </button>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-l"
          />
          <button
            onClick={() => sendMessage(input)}
            className="px-4 py-2 bg-blue-500 text-white rounded-r"
          >
            Send
          </button>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Messages: {messages.length}
        </div>
      </div>
    </div>
  );
}