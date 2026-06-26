import React, { useState, useRef, useEffect } from "react";
import { 
  File, 
  FileText, 
  Image as ImageIcon, 
  Paperclip, 
  Trash2, 
  UploadCloud, 
  X,
  Eye,
  FolderOpen,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Attachment } from "../types";

interface AttachmentsListProps {
  attachments: Attachment[];
  onAddAttachment: (attachment: { name: string; type: string; size: number; data: string }) => void;
  onDeleteAttachment: (id: string) => void;
  isUploading: boolean;
}

export default function AttachmentsList({
  attachments,
  onAddAttachment,
  onDeleteAttachment,
  isUploading,
}: AttachmentsListProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevCountRef = useRef(attachments.length);
  useEffect(() => {
    if (attachments.length > prevCountRef.current) {
      setIsCollapsed(false); // Auto-expand panel when a new file is uploaded
    }
    prevCountRef.current = attachments.length;
  }, [attachments.length]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5 text-purple-400" />;
    }
    if (type === "application/pdf") {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (type.startsWith("text/") || type.includes("word") || type.includes("document")) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    }
    return <File className="w-5 h-5 text-zinc-500" />;
  };

  const processFile = (file: File) => {
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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file: any) => {
        processFile(file);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: any) => {
        processFile(file);
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-t border-white/5 bg-[#0B0B0B] select-none flex flex-col shrink-0">
      {/* Collapsible Header */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-8 py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors border-b border-transparent"
        id="attachments-header-toggle"
      >
        <div className="flex items-center gap-2.5">
          <Paperclip className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <h3 className="text-xs font-semibold text-zinc-300 tracking-tight flex items-center gap-1.5">
            Attachments 
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/30">
              {attachments.length}
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-medium">
            {isCollapsed ? "Show attachments & uploads" : "Hide panel"}
          </span>
          {isCollapsed ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Collapsible Content Body */}
      {!isCollapsed && (
        <div className="p-6 pt-4 border-t border-white/5 max-h-[300px] overflow-y-auto">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#8B5CF6] bg-[#8B5CF6]/5"
                : "border-white/10 bg-[#151515]/30 hover:border-white/20 hover:bg-[#151515]/50"
            }`}
            id="attachment-dropzone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              id="hidden-file-input"
            />
            <UploadCloud className={`w-6 h-6 mx-auto mb-2 transition-transform duration-300 ${isDragging ? "translate-y-[-2px] text-[#8B5CF6]" : "text-zinc-600"}`} />
            <p className="text-xs font-medium text-zinc-300">
              {isUploading ? "Uploading file and embedding..." : "Drag & drop files here, or click to browse"}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              Supports PDFs, Images, DOCX, TXT, and MD (Max 10MB)
            </p>
          </div>

          {/* Attachments Cards Grid */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {attachments.map((att) => {
                const isImage = att.type.startsWith("image/");
                return (
                  <div
                    key={att.id}
                    className="group relative bg-[#151515] border border-white/5 rounded-md overflow-hidden transition-all flex flex-col justify-between"
                  >
                    {/* Thumbnail Preview for Images */}
                    {isImage && (
                      <div 
                        onClick={() => setPreviewImage(att.data)}
                        className="h-28 w-full bg-black/40 relative flex items-center justify-center overflow-hidden cursor-pointer"
                      >
                        <img
                          src={att.data}
                          alt={att.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Card Info Section */}
                    <div className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] shrink-0 font-bold text-[10px]">
                        {isImage ? "IMG" : att.type === "application/pdf" ? "PDF" : "DOC"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white font-medium truncate" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[10px] opacity-40">
                          {formatSize(att.size)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Card Controls */}
                    <div className="px-3 py-2 bg-[#0B0B0B]/50 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">
                        {att.type.split("/")[1] || "DOC"}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {isImage && (
                          <button
                            onClick={() => setPreviewImage(att.data)}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
                            title="Preview Image"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteAttachment(att.id)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Delete Attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox Modal Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="p-2 bg-[#151515] hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={previewImage}
            alt="Preview attachment"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] object-contain rounded-md border border-white/10 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
