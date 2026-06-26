import React, { useState, useEffect, useRef } from "react";
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  CheckSquare, 
  Code, 
  Table, 
  Link as LinkIcon, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  CloudRain, 
  FolderSync,
  Sparkles,
  BookOpen,
  Paperclip,
  Menu
} from "lucide-react";
import { Note } from "../types";

interface EditorProps {
  note: Note;
  onUpdateNote: (updatedNote: Partial<Note>) => void;
  isSaving: boolean;
  onOpenAiAssistant: () => void;
  onAddAttachment: (attachment: { name: string; type: string; size: number; data: string }) => void;
  onToggleSidebar?: () => void;
}

export default function Editor({
  note,
  onUpdateNote,
  isSaving,
  onOpenAiAssistant,
  onAddAttachment,
  onToggleSidebar,
}: EditorProps) {
  const [viewMode, setViewMode] = useState<"write" | "preview" | "split">("write");
  const [localTitle, setLocalTitle] = useState(note.title);
  const [localContent, setLocalContent] = useState(note.content);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const toolbarFileInputRef = useRef<HTMLInputElement>(null);

  const handleToolbarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: any) => {
        // Limit to 10MB to avoid extreme memory overhead in browser
        if (file.size > 10 * 1024 * 1024) {
          alert("Memora supports file uploads up to 10MB in development mode.");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result as string;
          onAddAttachment({
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            data: base64Data
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Sync state when active note changes
  useEffect(() => {
    setLocalTitle(note.title);
    setLocalContent(note.content);
  }, [note.id]);

  // Debounced autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localTitle !== note.title || localContent !== note.content) {
        onUpdateNote({
          title: localTitle,
          content: localContent,
        });
      }
    }, 800); // 800ms debounce
    return () => clearTimeout(timer);
  }, [localTitle, localContent]);

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setLocalContent(newContent);
    onUpdateNote({ content: newContent });

    // Refocus and select
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };


  // Helper to convert simple markdown to HTML preview natively for maximum speed
  const renderSimpleMarkdown = (markdown: string) => {
    if (!markdown) return "<p class='text-zinc-500 italic'>Type something to begin...</p>";
    
    let html = markdown
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");

    // Checkboxes (interactive checkboxes!)
    html = html.replace(/^\- \[[xX]\] (.*?)$/gm, '<li class="list-none flex items-start gap-2"><input type="checkbox" checked disabled class="accent-[#8B5CF6] mt-1.5 h-4 w-4 rounded border-[#333] bg-zinc-900" /> <span class="line-through text-zinc-500">$1</span></li>');
    html = html.replace(/^\- \[[ \]] (.*?)$/gm, '<li class="list-none flex items-start gap-2"><input type="checkbox" disabled class="accent-[#8B5CF6] mt-1.5 h-4 w-4 rounded border-[#333] bg-zinc-900" /> <span>$1</span></li>');

    // Bullet lists
    html = html.replace(/^\* (.*?)$/gm, "<li>$1</li>");
    html = html.replace(/^\- (?!\[)(.*?)$/gm, "<li>$1</li>");

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gm, "<pre><code>$1</code></pre>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Tables (Simple parsing)
    html = html.replace(/^\|(.*?)\|$/gm, (match) => {
      const cells = match.split("|").filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join("");
      return `<tr>${cells}</tr>`;
    });

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" referrerPolicy="no-referrer">$1</a>');

    // Paragraphs (join adjacent lines)
    const blocks = html.split(/\n{2,}/);
    const parsedBlocks = blocks.map((block) => {
      if (block.trim().startsWith("<h") || block.trim().startsWith("<pre") || block.trim().startsWith("<li") || block.trim().startsWith("<tr")) {
        return block;
      }
      return `<p>${block.replace(/\n/g, "<br />")}</p>`;
    });

    return parsedBlocks.join("");
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0B0B0B] text-zinc-200 min-h-0">
      {/* Upper Editor Action Bar */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between select-none">
        <div className="flex items-center gap-4">
          {/* Mobile Toggle Sidebar Trigger */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-1.5 bg-[#151515] hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-md border border-white/5"
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Cloud Auto Save Indicator */}
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
            {isSaving ? (
              <>
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                <span className="font-mono text-[10px] text-zinc-400">Syncing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[10px] text-emerald-400">Saved to Cloud</span>
              </>
            )}
          </div>
        </div>

        {/* View Mode & AI Button */}
        <div className="flex items-center gap-3">
          {/* Write / Preview Tab Toggles */}
          <div className="flex items-center bg-[#151515] p-1 rounded-md border border-white/5">
            <button
              onClick={() => setViewMode("write")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "write" 
                  ? "bg-[#0B0B0B] text-white border border-white/5 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              id="write-tab-btn"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "preview" 
                  ? "bg-[#0B0B0B] text-white border border-white/5 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              id="preview-tab-btn"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "split" 
                  ? "bg-[#0B0B0B] text-white border border-white/5 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              id="split-tab-btn"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Ask AI Trigger */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-md text-xs font-medium transition-all shadow-md shadow-[#8B5CF6]/10 hover:shadow-[#8B5CF6]/20 active:scale-[0.98] border border-white/5"
            id="editor-ask-ai-btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Editor Main Title Canvas */}
      <div className="px-8 pt-6 pb-2 select-text">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Untitled Note"
          className="w-full bg-transparent text-white font-extrabold text-3xl placeholder-zinc-800 border-none focus:outline-none focus:ring-0 tracking-tight"
          id="note-title-input"
        />
      </div>

      {/* Formatting Tools Toolbar */}
      {viewMode !== "preview" && (
        <div className="px-8 py-2 border-b border-white/5 bg-[#151515]/20 flex items-center gap-1 overflow-x-auto select-none">
          <button
            onClick={() => insertMarkdown("**", "**")}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown("*", "*")}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown("# ")}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown("## ")}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-white/5 mx-1" />
          <button
            onClick={() => insertMarkdown("* ")}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown("- [ ] ")}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5"
            title="Checklist"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown("```\n", "\n```")}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5"
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown("| Column 1 | Column 2 |\n| -------- | -------- |\n| Item 1   | Item 2   |")}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5"
            title="Table"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => toolbarFileInputRef.current?.click()}
            className="p-1.5 hover:bg-[#151515] text-zinc-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5 flex items-center gap-1.5"
            title="Add File"
            id="editor-add-file-btn"
          >
            <Paperclip className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-medium">Add File</span>
          </button>
          <input
            type="file"
            ref={toolbarFileInputRef}
            onChange={handleToolbarFileChange}
            accept=".pdf,image/*,.docx,.txt,.md"
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* Writing Canvas / Preview Canvas */}
      <div className="flex-1 overflow-y-auto p-8 select-text">
        {viewMode === "write" && (
          <textarea
            ref={editorRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            placeholder="Start typing in Markdown... Use the toolbar above or Ask AI to help design your outline."
            className="w-full h-full bg-transparent text-zinc-300 placeholder-zinc-800 border-none focus:outline-none focus:ring-0 font-sans text-sm resize-none leading-relaxed"
            id="editor-textarea"
          />
        )}

        {viewMode === "preview" && (
          <div 
            className="markdown-body max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(localContent) }}
            id="editor-preview-container"
          />
        )}

        {viewMode === "split" && (
          <div className="w-full h-full flex gap-8">
            <div className="flex-1 border-r border-white/5 pr-4">
              <textarea
                ref={editorRef}
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder="Start typing in Markdown..."
                className="w-full h-full bg-transparent text-zinc-300 placeholder-zinc-800 border-none focus:outline-none focus:ring-0 font-sans text-sm resize-none leading-relaxed"
              />
            </div>
            <div 
              className="flex-1 overflow-y-auto markdown-body"
              dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(localContent) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
