import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, User } from 'lucide-react';
import { chatWithSupport } from '../services/geminiService';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Hi! I can help with orders, pickup slots, or payment issues. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
        // Convert history for context if needed, currently passing simpler context in service
        const history = messages.map(m => ({ role: m.sender, content: m.text }));
        const responseText = await chatWithSupport(input, history);
        
        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: responseText || "I'm having trouble connecting to the kitchen."
        };
        setMessages(prev => [...prev, botMsg]);
    } catch (err) {
        console.error(err);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end transition-all duration-300">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] md:w-96 glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[50vh] md:max-h-[600px] border border-white/10">
          
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex justify-between items-center">
            <div className="flex items-center space-x-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Bot className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-white text-sm">Support Bot</h3>
                 <div className="flex items-center text-[10px] text-green-400 font-bold">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span> Online
                 </div>
               </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/30 min-h-[200px]">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-tr-none shadow-lg shadow-orange-500/10' 
                      : 'bg-slate-800 border border-white/5 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                   <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-tl-none p-4 flex space-x-1 items-center">
                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                   </div>
               </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900/50 backdrop-blur-md border-t border-white/5">
             <form onSubmit={handleSend} className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for help..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder-slate-500"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800 hover:bg-orange-500 text-slate-400 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
             </form>
             <div className="text-center mt-2">
                 <p className="text-[10px] text-slate-600 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 mr-1 text-indigo-500" /> Powered by Gemini AI
                 </p>
             </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
            isOpen 
            ? 'bg-slate-800 text-slate-400 rotate-90' 
            : 'bg-gradient-to-r from-orange-500 to-pink-600 text-white animate-bounce'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </div>
  );
};

export default Chatbot;