import React, { useState, useEffect, useRef } from "react";
import { Sparkles, FileText, Menu, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import AttachmentsList from "./components/AttachmentsList";
import AiDrawer from "./components/AiDrawer";
import { Note, Message, FolderType } from "./types";
import { useAuth } from "./context/AuthContext";
import AuthScreen from "./components/AuthScreen";
import { supabase } from "./lib/supabase";

const API_URL = ((import.meta as any).env?.VITE_API_URL || "").trim();

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  
  // Isolated chat history maps by noteId
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const chatLoadedForRef = useRef<string | null>(null);

  // Load chat histories from localStorage on user change
  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`memora_chat_histories_${user.id}`);
        if (stored) {
          setChatHistories(JSON.parse(stored));
        } else {
          setChatHistories({});
        }
      } catch (err) {
        console.error("Error loading chat histories:", err);
      }
      chatLoadedForRef.current = user.id;
    } else {
      setChatHistories({});
      chatLoadedForRef.current = null;
    }
  }, [user?.id]);

  // Deterministic helper to update and persist chat history without race conditions
  const updateChatHistory = (noteId: string, updatedMessages: Message[]) => {
    setChatHistories((prev) => {
      const updatedHistories = {
        ...prev,
        [noteId]: updatedMessages
      };
      if (user?.id) {
        try {
          localStorage.setItem(`memora_chat_histories_${user.id}`, JSON.stringify(updatedHistories));
        } catch (err) {
          console.error("Error saving chat history:", err);
        }
      }
      return updatedHistories;
    });
  };

  const showSuccess = (msg: string) => {
    setSuccessNotification(msg);
    setTimeout(() => {
      setSuccessNotification(null);
    }, 4000);
  };

  // Retrieve token headers dynamically for authenticated requests
  const getAuthHeaders = async () => {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return { "Authorization": `Bearer ${session.access_token}` };
      }
    }
    const storedUser = localStorage.getItem("memora_user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      return { "Authorization": `Bearer ${u.id}` };
    }
    return {};
  };
   const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notes`, {
                                        headers,
                                      });
      if (!res.ok) throw new Error("Failed to load notes");
      const data: Note[] = await res.json();
      setNotes(data);
      if (data.length > 0 && !selectedNoteId) {
        setSelectedNoteId(data[0].id);
      }
    } catch (err: any) {
      showError("Could not retrieve notes from server.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial notes whenever the authenticated user state changes
  useEffect(() => {
    if (user) {
      fetchNotes();
    } else {
      setNotes([]);
      setSelectedNoteId(null);
      setIsLoading(false);
    }
  }, [user?.id]);

 
  const showError = (msg: string) => {
    setErrorNotification(msg);
    setTimeout(() => {
      setErrorNotification(null);
    }, 6000);
  };

  // Get current active note object
  const activeNote = notes.find((note) => note.id === selectedNoteId) || null;

  const handleCreateNoteFromAi = async (content: string) => {
    try {
      const headers = await getAuthHeaders();
      const baseTitle = activeNote ? activeNote.title : "Untitled Note";
      const title = `AI Study: ${baseTitle}`;
      
      const res = await fetch(`${API_URL}/api/notes`, {
        method: "POST",
        headers: { 
          ...headers,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          title,
          content,
          folder: "AI"
        })
      });
      if (!res.ok) throw new Error("Failed to create note");
      const newNote: Note = await res.json();
      
      // Copy current note's chat history to the new note so switching focus doesn't clear the chat
      if (activeNote) {
        const parentHistory = chatHistories[activeNote.id] || [];
        updateChatHistory(newNote.id, parentHistory);
      }
      
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      showSuccess(`Saved response as new note: "${title}"`);
    } catch (err) {
      showError("Error saving AI response as a new note.");
    }
  };

  const handleAppendToNoteFromAi = async (aiContent: string) => {
    if (!activeNote) return;
    const separator = activeNote.content ? "\n\n---\n\n" : "";
    const updatedContent = `${activeNote.content}${separator}${aiContent}`;
    await handleUpdateNote({ content: updatedContent });
    showSuccess("Inserted AI response into active note.");
  };

  // 1. Create note
  const handleCreateNote = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notes`, {
        method: "POST",
        headers: { 
          ...headers,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          title: "Untitled Note",
          content: "",
          folder: "Uncategorized"
        })
      });
      if (!res.ok) throw new Error("Failed to create note");
      const newNote: Note = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      showError("Error creating note on the server.");
    }
  };

  // 2. Delete note
  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notes/${id}`, {
        method: "DELETE",
        headers
      });
      if (!res.ok) throw new Error("Failed to delete note");
      
      const updatedNotes = notes.filter((n) => n.id !== id);
      setNotes(updatedNotes);
      
      // If deleted active note, switch active selection
      if (selectedNoteId === id) {
        setSelectedNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
      }
    } catch (err) {
      showError("Error deleting note on server.");
    }
  };

  // 3. Update active note & trigger cloud autosave
  const handleUpdateNote = async (updatedFields: Partial<Note>) => {
    if (!selectedNoteId) return;
    setIsSaving(true);
    
    // Update local cache state instantly for responsive feel
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === selectedNoteId ? { ...note, ...updatedFields } : note
      )
    );

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notes/${selectedNoteId}`, {
        method: "PUT",
        headers: { 
          ...headers,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error("Failed to save changes");
    } catch (err) {
      console.error("Autosave error:", err);
      // Wait to notify in case of transient network issues
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Toggle Favorite
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const nextFavoriteValue = !note.favorite;
    
    // Optimistic local state update
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, favorite: nextFavoriteValue } : n))
    );

    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/api/notes/${id}`, {
        method: "PUT",
        headers: { 
          ...headers,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ favorite: nextFavoriteValue })
      });
    } catch (err) {
      showError("Failed to update favorite status.");
    }
  };

  // 5. Add attachment reference
  const handleAddAttachment = async (attachment: { name: string; type: string; size: number; data: string }) => {
    if (!selectedNoteId) return;
    
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notes/${selectedNoteId}/attachments`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(attachment)
      });
      if (!res.ok) throw new Error("Failed to upload attachment");
      const savedAttachment = await res.json();
      
      // Update local note attachments
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id === selectedNoteId) {
            return {
              ...note,
              attachments: [...note.attachments, savedAttachment],
              updatedAt: new Date().toISOString()
            };
          }
          return note;
        })
      );
    } catch (err) {
      showError("Error uploading attachment to server.");
    }
  };

  // 6. Delete attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedNoteId) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notes/${selectedNoteId}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers
      });
      if (!res.ok) throw new Error("Failed to delete attachment");

      // Update local state
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id === selectedNoteId) {
            return {
              ...note,
              attachments: note.attachments.filter((att) => att.id !== attachmentId),
              updatedAt: new Date().toISOString()
            };
          }
          return note;
        })
      );
    } catch (err) {
      showError("Error deleting attachment on server.");
    }
  };

  // 7. Ask AI Query Trigger (ChatGPT-Style)
  const handleSendMessage = async (text: string, quickAction?: string) => {
    if (!selectedNoteId || isGenerating) return;

    const noteId = selectedNoteId;
    const currentHistory = chatHistories[noteId] || [];

    // Append user query message block (unless it's a direct click on a quickAction that requires no input)
    let updatedHistory = [...currentHistory];
    if (text.trim()) {
      const userMsg: Message = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      };
      updatedHistory = [...updatedHistory, userMsg];
    } else if (quickAction) {
      const actionMsg: Message = {
        id: `msg-${Date.now()}-action`,
        role: "user",
        content: `⚡ Quick Action: ${quickAction}`,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      };
      updatedHistory = [...updatedHistory, actionMsg];
    }

    updateChatHistory(noteId, updatedHistory);

    setIsGenerating(true);
    setIsAiDrawerOpen(true); // Open AI side-drawer automatically to guide attention

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/notes/${noteId}/ask-ai`, {
        method: "POST",
        headers: { 
          ...headers,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          message: text,
          quickAction,
          chatHistory: updatedHistory.slice(-10) // Limit to last 10 messages for prompt efficiency
        })
      });

      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error || "Failed to prompt AI");
      }

      const data = await res.json();
      
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "model",
        content: data.reply,
        actionUsed: data.actionUsed,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      };

      updateChatHistory(noteId, [...updatedHistory, assistantMsg]);

    } catch (err: any) {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        role: "model",
        content: `❌ **Error:** ${err.message || "An issue occurred communicating with the server. Ensure your Gemini API Key is entered."}`,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      };
      updateChatHistory(noteId, [...updatedHistory, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = () => {
    if (!selectedNoteId) return;
    updateChatHistory(selectedNoteId, []);
  };

  if (authLoading) {
    return (
      <div className="w-screen h-screen bg-[#0B0B0B] flex flex-col items-center justify-center text-center gap-4">
        <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
        <p className="text-xs font-mono text-zinc-500">Initializing Memora Secure Node...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="w-screen h-screen bg-[#0B0B0B] text-zinc-300 flex overflow-hidden font-sans relative antialiased">
      {/* Absolute Error Notification */}
      {errorNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-950/90 text-rose-200 border border-rose-800/50 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-xs font-semibold">{errorNotification}</span>
        </div>
      )}

      {/* Absolute Success Notification */}
      {successNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#8B5CF6]/95 text-white border border-[#7C3AED]/50 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <Sparkles className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <span className="text-xs font-semibold">{successNotification}</span>
        </div>
      )}

      {/* Mobile Sidebar Backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Collapsible Sidebar Left */}
      <Sidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={(id) => {
          setSelectedNoteId(id);
          if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        onToggleFavorite={handleToggleFavorite}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCollapsibleOpen={isSidebarOpen}
        setIsCollapsibleOpen={setIsSidebarOpen}
      />

      {/* Center Main Editor Space */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-[#0B0B0B]">
        {isLoading && notes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
            <p className="text-xs font-mono text-zinc-600">Initializing Memora Node Workspace...</p>
          </div>
        ) : activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
            {/* Editor Text Area */}
            <div className="flex-1 min-h-0 flex flex-col">
              <Editor
                note={activeNote}
                onUpdateNote={handleUpdateNote}
                isSaving={isSaving}
                onOpenAiAssistant={() => setIsAiDrawerOpen(true)}
                onAddAttachment={handleAddAttachment}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            </div>
            
            {/* Attachments Dropzone tray */}
            <AttachmentsList
              attachments={activeNote.attachments}
              onAddAttachment={handleAddAttachment}
              onDeleteAttachment={handleDeleteAttachment}
              isUploading={false}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none relative">
            {/* Mobile Hamburger menu for empty state */}
            <div className="absolute top-4 left-4 md:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-[#151515] hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg border border-white/5"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#222] flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
              <FileText className="w-6 h-6 text-[#8B5CF6]" />
            </div>
            <h2 className="text-lg font-extrabold text-white">No active note selected</h2>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4 leading-relaxed">
              Select an existing note or create a new note to start writing with AI support.
            </p>
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-lg transition-all"
            >
              <span>Create Note</span>
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Right Sidebar AI Drawer */}
      {activeNote && (
        <AiDrawer
          note={activeNote}
          isOpen={isAiDrawerOpen}
          onClose={() => setIsAiDrawerOpen(false)}
          chatHistory={chatHistories[activeNote.id] || []}
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onClearHistory={handleClearHistory}
          onCreateNoteFromAi={handleCreateNoteFromAi}
          onAppendToNoteFromAi={handleAppendToNoteFromAi}
        />
      )}
    </div>
  );
}
