import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  X, 
  Send, 
  Compass, 
  Bot, 
  User, 
  RefreshCw, 
  BookMarked, 
  HelpCircle, 
  Lightbulb,
  FileCheck,
  BrainCircuit,
  MessageSquare,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  FilePlus,
  Plus,
  Copy,
  Check
} from "lucide-react";
import { Note, Message } from "../types";

interface AiDrawerProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  chatHistory: Message[];
  onSendMessage: (text: string, quickAction?: string) => Promise<void>;
  isGenerating: boolean;
  onClearHistory: () => void;
  onCreateNoteFromAi?: (content: string) => void;
  onAppendToNoteFromAi?: (content: string) => void;
}

export default function AiDrawer({
  note,
  isOpen,
  onClose,
  chatHistory,
  onSendMessage,
  isGenerating,
  onClearHistory,
  onCreateNoteFromAi,
  onAppendToNoteFromAi,
}: AiDrawerProps) {
  const [inputText, setInputText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [loadingPhrase, setLoadingPhrase] = useState("Consulting knowledge base...");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reassuring animated loading phrases
  const loadingPhrases = [
    "Consulting local knowledge base...",
    "Embedding note references...",
    "Scanning text attachments for keywords...",
    "Analyzing image pixels via multimodal input...",
    "Synthesizing summary cards in Gemini-3.5-flash...",
    "Refining academic vocabulary...",
    "Finalizing study aid layouts..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % loadingPhrases.length;
        setLoadingPhrase(loadingPhrases[idx]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    
    const textToSend = inputText;
    setInputText("");
    onSendMessage(textToSend);
  };

  const handleQuickAction = (action: string) => {
    if (isGenerating) return;
    onSendMessage("", action);
  };

  // Modern chip quick actions
  const quickActions = [
    { name: "Summarize", desc: "Short summary", icon: <FileCheck className="w-3.5 h-3.5" /> },
    { name: "Explain", desc: "Break down concepts", icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { name: "Rewrite", desc: "Polished markdown", icon: <Compass className="w-3.5 h-3.5" /> },
    { name: "Create Flashcards", desc: "Q&A test cards", icon: <BrainCircuit className="w-3.5 h-3.5" /> },
    { name: "Generate Quiz", desc: "Interactive questions", icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { name: "Create Study Notes", desc: "Structured index", icon: <BookMarked className="w-3.5 h-3.5" /> },
    { name: "Best Exam Answer", desc: "Academic model", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { name: "Find Information", desc: "Key facts & citation", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  // Helper to render Markdown replies simply inside the chat
  const renderChatMarkdown = (text: string) => {
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");

    // Bullet lists & Checklist items
    html = html.replace(/^\- \[[xX]\] (.*?)$/gm, '<li class="list-none flex items-start gap-1.5"><input type="checkbox" checked disabled class="accent-[#8B5CF6] mt-1 h-3.5 w-3.5" /> <span class="line-through text-zinc-500">$1</span></li>');
    html = html.replace(/^\- \[[ \]] (.*?)$/gm, '<li class="list-none flex items-start gap-1.5"><input type="checkbox" disabled class="accent-[#8B5CF6] mt-1 h-3.5 w-3.5" /> <span>$1</span></li>');
    html = html.replace(/^\* (.*?)$/gm, "<li>$1</li>");
    html = html.replace(/^\- (?!\[)(.*?)$/gm, "<li>$1</li>");

    // Inline formatting
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/`([^`]+)`/g, '<code class="bg-[#242424] text-[#F43F5E] px-1.5 py-0.5 rounded font-mono text-[11px]">$1</code>');

    // pre-formatted blocks
    html = html.replace(/```([\s\S]*?)```/gm, '<pre class="bg-[#121212] border border-[#222] p-3 rounded-lg overflow-x-auto text-[11px] font-mono text-zinc-300 my-2"><code>$1</code></pre>');

    // Break paragraphs
    html = html.split("\n\n").map(block => {
      if (block.trim().startsWith("<h") || block.trim().startsWith("<pre") || block.trim().startsWith("<li")) return block;
      return `<p class="mb-2 leading-relaxed">${block.replace(/\n/g, "<br />")}</p>`;
    }).join("");

    return html;
  };

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!inputText.trim() || isGenerating) return;
      const textToSend = inputText;
      setInputText("");
      onSendMessage(textToSend);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 w-full h-full flex flex-col bg-[#151515] md:static md:h-screen md:border-l md:border-white/5 md:transition-all md:duration-300 select-none md:z-40 md:relative md:shrink-0 shadow-2xl ${
      isExpanded ? "md:w-full md:max-w-[95vw] sm:md:w-[500px] md:md:w-[650px] lg:md:w-[800px]" : "md:w-[320px]"
    }`}>
      {/* Header section */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Knowledge Assistant</h3>
          <p className="text-[10px] text-zinc-500 truncate max-w-[150px] md:max-w-[300px] mt-0.5">
            Active: {note.title}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {chatHistory.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1 text-zinc-500 hover:text-zinc-300 text-[10px] font-mono transition-colors"
              title="Clear Thread"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden md:block p-1 text-zinc-500 hover:text-white transition-colors"
            title={isExpanded ? "Standard width" : "Expand chat"}
            id="expand-ai-drawer-btn"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            id="close-ai-drawer-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="p-6 border-b border-white/5">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-full flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 px-1 hover:text-zinc-400 transition-colors focus:outline-none"
        >
          <span>Quick Actions</span>
          {showQuickActions ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
        </button>
        {showQuickActions && (
          <div className="grid grid-cols-2 gap-2 mt-3 animate-fadeIn">
            {quickActions.slice(0, 4).map((action) => (
              <button
                key={action.name}
                onClick={() => handleQuickAction(action.name)}
                className="bg-[#0B0B0B] border border-white/5 py-2 px-3 rounded-md text-[11px] text-zinc-400 hover:text-white hover:border-[#8B5CF6]/50 transition-all text-center truncate font-medium"
                disabled={isGenerating}
                title={action.desc}
              >
                {action.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Thread list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 select-text">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center mb-3 border border-[#8B5CF6]/20">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <h4 className="text-xs font-semibold text-white mb-1">Knowledge AI</h4>
            <p className="text-[10px] text-zinc-500 max-w-[200px] leading-relaxed">
              Ask anything. I will synthesize notes and files using Gemini-3.5-flash.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg) => {
              const isAssistant = msg.role === "model";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[90%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Bubble Content */}
                  <div className={`p-4 rounded-xl text-xs font-sans ${
                    isAssistant 
                      ? "bg-[#0B0B0B] text-[#A1A1AA] border border-white/5 rounded-tl-none leading-relaxed" 
                      : "bg-[#8B5CF6] text-white rounded-tr-none font-medium leading-relaxed"
                  }`}>
                    {isAssistant && msg.actionUsed && (
                      <div className="inline-flex items-center gap-1 text-[8px] font-mono bg-[#8B5CF6]/10 text-[#A78BFA] px-1.5 py-0.5 rounded border border-[#8B5CF6]/25 mb-2 uppercase tracking-wider">
                        <span>{msg.actionUsed}</span>
                      </div>
                    )}
                    <div 
                      className={`chat-content select-text ${isAssistant ? "markdown-body" : ""}`}
                      dangerouslySetInnerHTML={{ __html: isAssistant ? renderChatMarkdown(msg.content) : msg.content }}
                    />
                    <div className="text-[8px] opacity-30 mt-2 text-right">
                      {msg.timestamp}
                    </div>

                    {isAssistant && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
                        {onCreateNoteFromAi && (
                          <button
                            onClick={() => onCreateNoteFromAi(msg.content)}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] hover:bg-[#8B5CF6]/15 hover:text-white text-zinc-400 border border-white/5 hover:border-[#8B5CF6]/35 rounded transition-all cursor-pointer font-medium"
                            title="Create a new note with this content"
                          >
                            <FilePlus className="w-3 h-3 text-[#8B5CF6]" />
                            <span>Save as Note</span>
                          </button>
                        )}
                        {onAppendToNoteFromAi && (
                          <button
                            onClick={() => onAppendToNoteFromAi(msg.content)}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] hover:bg-[#8B5CF6]/15 hover:text-white text-zinc-400 border border-white/5 hover:border-[#8B5CF6]/35 rounded transition-all cursor-pointer font-medium"
                            title="Append this content to your active note"
                          >
                            <Plus className="w-3 h-3 text-[#8B5CF6]" />
                            <span>Insert into Note</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyContent(msg.content, msg.id)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] hover:bg-[#8B5CF6]/15 hover:text-white text-zinc-400 border border-white/5 hover:border-[#8B5CF6]/35 rounded transition-all cursor-pointer ml-auto font-medium"
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-zinc-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading Generator Spinner */}
        {isGenerating && (
          <div className="flex gap-3 max-w-[90%] mr-auto">
            <div className="p-4 bg-[#0B0B0B] rounded-xl rounded-tl-none border border-white/5 flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 text-[#8B5CF6] animate-spin" />
                <span className="text-[10px] text-zinc-500 font-mono truncate">{loadingPhrase}</span>
              </div>
              <div className="flex gap-1 mt-1.5">
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Box */}
      <div className="p-6 mt-auto">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Ask anything about this note..."
            className="w-full bg-[#0B0B0B] border border-white/10 rounded-xl p-4 pr-12 text-xs focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] resize-none h-24 placeholder:opacity-30 text-white"
            id="ai-prompt-textarea"
          />
          <button
            type="button"
            onClick={() => {
              if (!inputText.trim() || isGenerating) return;
              const textToSend = inputText;
              setInputText("");
              onSendMessage(textToSend);
            }}
            disabled={!inputText.trim() || isGenerating}
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              inputText.trim() && !isGenerating
                ? "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20 hover:bg-[#7C3AED]"
                : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
            }`}
            id="send-prompt-btn"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
