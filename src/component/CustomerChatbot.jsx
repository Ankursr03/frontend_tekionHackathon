import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Car, DollarSign, Calendar, MessageSquare, 
  ChevronRight, X, Sparkles, Zap, ShieldCheck, ThumbsUp
} from 'lucide-react';

const SYSTEM_DELAY = 800; // ms to fake typing

// Mock Icons for options (must be defined before QUESTIONS; const is not hoisted)
const PhoneIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const MessageIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const MailIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const WhatsappIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.5 16.5c-4 1-9-4-8-8"/></svg>; // Simplified

const QUESTIONS = [
  {
    id: 'intro',
    text: "Welcome to Tekion Auto! I'm your AI Concierge. I can help you find your dream car in seconds. Ready to get started?",
    type: 'options',
    options: [
      { label: "Yes, let's go!", value: 'start', next: 'vehicle_class' },
      { label: "Just browsing", value: 'browsing', next: 'browsing_response' }
    ]
  },
  {
    id: 'vehicle_class',
    text: "Exciting! First, what type of vehicle fits your lifestyle?",
    type: 'grid-options',
    options: [
      { label: 'Sedan', icon: Car, value: 'sedan', next: 'budget' },
      { label: 'SUV', icon: ShieldCheck, value: 'suv', next: 'budget' },
      { label: 'Sports', icon: Zap, value: 'sports', next: 'budget' },
      { label: 'EV', icon: Sparkles, value: 'ev', next: 'budget' },
      { label: 'Used', icon: ThumbsUp, value: 'used', next: 'budget' }
    ]
  },
  {
    id: 'budget',
    text: "Great choice. What is your estimated budget for this vehicle?",
    type: 'input-currency',
    next: 'timeframe'
  },
  {
    id: 'timeframe',
    text: "Noted. When are you hoping to park this in your driveway?",
    type: 'options',
    options: [
      { label: "Immediately", value: 'immediate', next: 'communication' },
      { label: "Less than 1 month", value: '<1mo', next: 'communication' },
      { label: "1-3 months", value: '1-3mo', next: 'communication' },
      { label: "Just exploring", value: 'exploring', next: 'communication' }
    ]
  },
  {
    id: 'communication',
    text: "Last step! How would you prefer us to reach out with matches?",
    type: 'grid-options',
    options: [
      { label: 'Call', icon: PhoneIcon, value: 'call', next: 'closing' },
      { label: 'Text', icon: MessageIcon, value: 'text', next: 'closing' },
      { label: 'Email', icon: MailIcon, value: 'email', next: 'closing' },
      { label: 'WhatsApp', icon: WhatsappIcon, value: 'whatsapp', next: 'closing' }
    ]
  },
  {
    id: 'closing',
    text: "Perfect! I've curated a list of vehicles matching your criteria. A specialist is reviewing them now.",
    type: 'final'
  },
  {
      id: 'browsing_response',
      text: "No problem! Feel free to explore our inventory using the menu. I'm here if you need me.",
      type: 'final'
  }
];

const TypingIndicator = () => (
  <div className="flex gap-1 p-2 bg-[#2a2f38] rounded-2xl rounded-tl-none w-fit border border-[#3a414d]">
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export default function CustomerChatbot() {
  const [isOpen, setIsOpen] = useState(true); // Open by default for demo
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStepId, setCurrentStepId] = useState('intro');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Initial greeting
    if (messages.length === 0) {
      addSystemMessage('intro');
    }
  }, []);

  const addSystemMessage = (stepId) => {
    setIsTyping(true);
    const step = QUESTIONS.find(q => q.id === stepId);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        from: 'bot',
        text: step.text,
        widgetType: step.type,
        options: step.options,
        stepId: step.id
      }]);
    }, SYSTEM_DELAY);
  };

  const handleOptionClick = (option, currentStep) => {
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      from: 'user',
      text: option.label
    }]);

    // Proceed to next step
    if (option.next) {
      setCurrentStepId(option.next);
      addSystemMessage(option.next);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages(prev => [...prev, {
      id: Date.now(),
      from: 'user',
      text: `$${parseInt(inputValue).toLocaleString()}`
    }]);

    setInputValue('');
    
    // Find current question to get next step
    const currentQ = QUESTIONS.find(q => q.id === currentStepId);
    if (currentQ && currentQ.next) {
        setCurrentStepId(currentQ.next);
        addSystemMessage(currentQ.next);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="chatbot-trigger fixed bottom-6 right-6 p-4 bg-[#00D9FF] hover:bg-[#00c4e6] text-black rounded-full shadow-[0_0_20px_rgba(0,217,255,0.4)] transition-all hover:scale-110 z-50 group"
      >
        <MessageSquare size={28} className="fill-black/10 stroke-black" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0f1115] animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Chat Container */}
        <div className="w-full max-w-md bg-[#0f1115] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#2a2f38] flex flex-col h-[80vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="p-4 border-b border-[#2a2f38] flex items-center justify-between bg-[#181b21]">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center">
                            <Bot className="text-white w-6 h-6" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#181b21]" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Tekion AI Concierge</h3>
                        <p className="text-[#00D9FF] text-xs font-medium">Online • Instantly replies</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-[#2a2f38] text-gray-400 hover:text-white rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <div className="text-center text-xs text-gray-600 mb-4">Today</div>
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                        {msg.from === 'bot' && (
                            <div className="w-8 h-8 rounded-full bg-[#1f232b] flex items-center justify-center mr-2 mt-auto border border-[#2a2f38] shrink-0">
                                <Bot size={14} className="text-[#00D9FF]" />
                            </div>
                        )}
                        
                        <div className={`max-w-[80%] space-y-2`}>
                            <div className={`p-3.5 text-sm rounded-2xl ${
                                msg.from === 'user' 
                                    ? 'bg-[#00D9FF] text-black font-medium rounded-tr-sm' 
                                    : 'bg-[#2a2f38] text-gray-200 border border-[#3a414d] rounded-tl-sm'
                            }`}>
                                {msg.text}
                            </div>

                            {/* Options Widget */}
                            {msg.widgetType === 'options' && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {msg.options.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(opt, msg.stepId)}
                                            className="px-4 py-2 bg-[#181b21] hover:bg-[#00D9FF]/10 hover:text-[#00D9FF] border border-[#2a2f38] hover:border-[#00D9FF]/50 rounded-full text-xs font-semibold text-gray-300 transition-all duration-200"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Grid Options Widget (for icons) */}
                            {msg.widgetType === 'grid-options' && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {msg.options.map((opt, idx) => {
                                        const Icon = opt.icon;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionClick(opt, msg.stepId)}
                                                className="flex flex-col items-center gap-2 p-3 bg-[#181b21] hover:bg-[#00D9FF]/10 border border-[#2a2f38] hover:border-[#00D9FF]/50 rounded-xl text-gray-300 hover:text-[#00D9FF] transition-all group"
                                            >
                                                {Icon && <Icon className="w-6 h-6 text-gray-500 group-hover:text-[#00D9FF] transition-colors" />}
                                                <span className="text-xs font-semibold">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Input Widget */}
                            {msg.widgetType === 'input-currency' && (
                                <form onSubmit={handleInputSubmit} className="mt-2 flex gap-2">
                                    <div className="relative flex-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="number"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Enter amount..."
                                            className="w-full bg-[#181b21] border border-[#2a2f38] rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] transition-all text-sm"
                                            autoFocus
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={!inputValue}
                                        className="p-3 bg-[#00D9FF] text-black rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-[#1f232b] flex items-center justify-center mr-2 border border-[#2a2f38]">
                            <Bot size={14} className="text-[#00D9FF]" />
                        </div>
                        <TypingIndicator />
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar (Disabled when navigating options for simpler UX, enabled only for chat) */}
            <div className="p-4 bg-[#181b21] border-t border-[#2a2f38]">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        disabled={true} 
                        className="flex-1 bg-[#0f1115] border border-[#2a2f38] rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                    />
                    <button disabled className="p-3 bg-[#2a2f38] text-gray-500 rounded-xl cursor-not-allowed">
                        <Send size={18} />
                    </button>
                </div>
                <div className="text-center mt-2">
                     <p className="text-[10px] text-gray-600">Powered by Tekion Intelligence AI</p>
                </div>
            </div>

        </div>
    </div>
  );
}
