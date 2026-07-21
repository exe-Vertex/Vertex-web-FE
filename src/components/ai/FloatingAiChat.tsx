import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Minimize2, Loader2 } from 'lucide-react';
import { chatWithAi, getAiHistory, AiHistory } from '../../api/ai';
import { getAccessToken } from '../../utils/authStorage';

export const FloatingAiChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiHistory[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const token = getAccessToken() || '';
  const orgId = localStorage.getItem('vertex.activeOrgId') || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && token) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setIsFetchingHistory(true);
      const history = await getAiHistory(token);
      setMessages(history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to load AI history', error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !token || isLoading) return;

    const userPrompt = inputValue.trim();
    setInputValue('');
    
    // Optimistic update
    const tempId = Date.now().toString();
    const tempMessage: AiHistory = {
      id: tempId,
      userId: 'temp',
      prompt: userPrompt,
      planSummary: '',
      tokensUsed: 0,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setIsLoading(true);

    try {
      const response = await chatWithAi(token, userPrompt, orgId);
      setMessages(prev => prev.map(m => m.id === tempId ? response : m));
    } catch (error) {
      console.error('AI Chat Error:', error);
      const message = error instanceof Error ? error.message : 'Unable to connect to AI.';
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, planSummary: message } : m));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-105 transition-all duration-300 z-50 border border-green-400/30 group"
      >
        <Sparkles className="text-white w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[550px] bg-[#0F1A2A]/95 backdrop-blur-xl border border-green-500/20 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transform transition-all duration-300 ease-out">
      {/* Header */}
      <div className="px-4 py-3 border-b border-green-500/10 flex items-center justify-between bg-gradient-to-r from-[#162032] to-[#0F1A2A]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-yellow-500 p-[1px]">
            <div className="w-full h-full bg-[#0F1A2A] rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Vertex AI</h3>
            <p className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 && !isFetchingHistory && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm">Hi there! I am Vertex AI.</p>
            <p className="text-xs">How can I help you manage your projects today?</p>
          </div>
        )}
        
        {isFetchingHistory && (
          <div className="flex justify-center p-4">
            <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-4">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-green-600/20 text-green-50 border border-green-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                {msg.prompt}
              </div>
            </div>
            {/* AI Response */}
            {(msg.planSummary || msg.planData) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-[#162032] text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap">
                  {msg.planSummary || msg.planData}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#162032] border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 ai-typing-dot"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 ai-typing-dot"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 ai-typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#0A0F1A] border-t border-green-500/10">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            className="w-full bg-[#162032] text-sm text-white placeholder-slate-400 border border-slate-700/50 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-1.5 p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white disabled:opacity-50 disabled:hover:bg-green-500/10 disabled:hover:text-green-500 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
