import React, { useState } from "react";
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Plus, 
  Search, 
  FileText, 
  Trash2,
  Bookmark,
  LogOut,
  X,
  User,
  Mail,
  Shield,
  Edit2,
  Check
} from "lucide-react";
import { Note } from "../types";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (fav: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCollapsibleOpen: boolean;
  setIsCollapsibleOpen: (open: boolean) => void;
}

export default function Sidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onToggleFavorite,
  showFavoritesOnly,
  setShowFavoritesOnly,
  searchQuery,
  setSearchQuery,
  isCollapsibleOpen,
  setIsCollapsibleOpen,
}: SidebarProps) {
  const { profile, signOut, updateProfile, isDemoMode } = useAuth();
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleOpenProfileModal = () => {
    setNewName(profile?.full_name || "");
    setIsEditingName(false);
    setUpdateError(null);
    setIsProfileModalOpen(true);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const success = await updateProfile(newName.trim());
      if (success) {
        setIsEditingName(false);
      } else {
        setUpdateError("Failed to update name. Try again.");
      }
    } catch (err) {
      setUpdateError("An unexpected error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter notes based on favorite and search
  const filteredNotes = notes.filter((note) => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (showFavoritesOnly) {
      return note.favorite;
    }

    return true;
  });

  const getFavoritesCount = () => {
    return notes.filter((n) => n.favorite).length;
  };

  if (!isCollapsibleOpen) {
    return (
      <div className="hidden md:flex w-16 h-screen bg-[#0B0B0B] border-r border-white/5 flex-col items-center py-6 transition-all duration-300">
        <button 
          onClick={() => setIsCollapsibleOpen(true)}
          className="p-2 bg-[#151515] hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg border border-white/5 mb-8"
          id="expand-sidebar-btn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-6 items-center flex-1 w-full px-2">
          <button 
            onClick={() => { setShowFavoritesOnly(false); }}
            className={`p-2 rounded-lg ${!showFavoritesOnly ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20" : "text-zinc-500 hover:text-zinc-300"}`}
            title="All Notes"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button 
            onClick={() => { setShowFavoritesOnly(true); }}
            className={`p-2 rounded-lg ${showFavoritesOnly ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20" : "text-zinc-500 hover:text-zinc-300"}`}
            title="Favorites"
          >
            <Heart className="w-5 h-5" />
          </button>
          
          <div className="w-8 h-[1px] bg-white/5" />

          <button 
            onClick={() => onCreateNote()}
            className="p-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-transform active:scale-95 shadow-lg shadow-[#8B5CF6]/20"
            title="New Note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsed Profile Icon */}
        {profile && (
          <button
            onClick={signOut}
            className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 flex items-center justify-center font-bold text-[#8B5CF6] text-xs hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer relative group"
            title="Sign Out"
          >
            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
            {/* Hover tooltip */}
            <span className="absolute left-12 bg-zinc-900 border border-white/5 text-[10px] text-rose-400 font-semibold px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Sign Out ({profile.full_name || profile.email})
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 md:w-80 md:static md:h-screen bg-[#0B0B0B] border-r border-white/5 flex flex-col transition-all duration-300 select-none shadow-2xl md:shadow-none">
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/15">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight text-base block">Memora</span>
            <span className="text-[10px] font-mono text-zinc-500 block -mt-1">v1.0 AI-First</span>
          </div>
        </div>
        <button 
          onClick={() => setIsCollapsibleOpen(false)}
          className="p-1.5 hover:bg-[#151515] rounded-md text-zinc-500 hover:text-zinc-300 border border-white/5"
          id="collapse-sidebar-btn"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Search notes bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notes or files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151515] text-xs text-zinc-200 placeholder-zinc-600 rounded-md pl-9 pr-4 py-1.5 border border-white/5 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-all font-sans"
            id="sidebar-search-input"
          />
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {/* Main List Filters */}
        <div className="space-y-1">
          <button
            onClick={() => { setShowFavoritesOnly(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all ${
              !showFavoritesOnly 
                ? "bg-[#151515] text-white font-medium border border-white/5 shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#151515]/40"
            }`}
            id="all-notes-filter"
          >
            <div className="flex items-center gap-2">
              <BookOpen className={`w-3.5 h-3.5 ${!showFavoritesOnly ? "text-[#8B5CF6]" : "text-zinc-500"}`} />
              <span>All Notes</span>
            </div>
            <span className="text-[10px] bg-[#151515] text-zinc-500 px-2 py-0.5 rounded border border-white/5">
              {notes.length}
            </span>
          </button>

          <button
            onClick={() => { setShowFavoritesOnly(true); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all ${
              showFavoritesOnly 
                ? "bg-[#151515] text-white font-medium border border-white/5 shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#151515]/40"
            }`}
            id="favorites-filter"
          >
            <div className="flex items-center gap-2">
              <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? "text-[#8B5CF6]" : "text-zinc-500"}`} />
              <span>Favorites</span>
            </div>
            <span className="text-[10px] bg-[#151515] text-zinc-500 px-2 py-0.5 rounded border border-white/5">
              {getFavoritesCount()}
            </span>
          </button>
        </div>

        {/* Notes Items List */}
        <div className="pt-2 border-t border-white/5">
          <div className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
            {showFavoritesOnly ? "Favorites" : "Recent Notes"}
          </div>
          
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No notes found</p>
              <button 
                onClick={() => onCreateNote()}
                className="mt-2 text-[11px] text-[#8B5CF6] hover:underline"
              >
                Create a note
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                const dateString = new Date(note.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric"
                });
                // Excerpt clean of markdown titles
                const cleanExcerpt = note.content
                    .replace(/[#*`_\[\]\-]/g, "")
                    .trim()
                    .substring(0, 48) || "No additional text";

                return (
                  <div
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected 
                        ? "bg-[#151515] border-white/10 shadow-sm" 
                        : "bg-transparent hover:bg-[#151515]/40 border-transparent hover:border-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <h4 className={`text-xs font-semibold truncate flex-1 ${isSelected ? "text-white" : "text-zinc-300"}`}>
                        {note.title || "Untitled Note"}
                      </h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => onToggleFavorite(note.id, e)}
                          className={`p-0.5 rounded hover:bg-zinc-800 ${note.favorite ? "text-[#8B5CF6]" : "text-zinc-500 hover:text-zinc-300"}`}
                          title={note.favorite ? "Unfavorite" : "Favorite"}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={(e) => onDeleteNote(note.id, e)}
                          className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-zinc-500 line-clamp-1 mb-2">
                      {cleanExcerpt}
                    </p>

                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-zinc-600">{dateString}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer with Create Button */}
      <div className="p-4 border-t border-white/5 bg-[#0B0B0B] flex flex-col gap-3">
        <button
          onClick={() => onCreateNote()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] text-white rounded-md text-xs font-medium transition-all shadow-lg shadow-[#8B5CF6]/15 hover:shadow-[#8B5CF6]/25 border border-white/5"
          id="sidebar-new-note-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note</span>
        </button>

        {/* Profile Details Card */}
        {profile && (
          <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={handleOpenProfileModal}
              className="w-full flex items-center gap-2.5 min-w-0 text-left hover:bg-white/[0.03] p-1.5 rounded-lg transition-colors group/profile cursor-pointer"
              title="View Profile Details"
            >
              <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 group-hover/profile:border-[#8B5CF6]/50 flex items-center justify-center font-bold text-[#8B5CF6] group-hover/profile:text-[#C084FC] text-xs shrink-0 select-none transition-all">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white text-xs font-bold truncate group-hover/profile:text-[#C084FC] transition-colors">
                  {profile.full_name || "User"}
                </span>
                <span className="text-[10px] text-zinc-500 truncate">View profile</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Account Profile Modal */}
      {isProfileModalOpen && profile && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div 
            className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#8B5CF6]" />
                Account Profile
              </h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center">
              {/* Large Avatar */}
              <div className="w-20 h-20 rounded-full bg-[#8B5CF6]/10 border-2 border-[#8B5CF6]/30 flex items-center justify-center font-bold text-[#8B5CF6] text-3xl mb-4 select-none shadow-lg shadow-[#8B5CF6]/5">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
              </div>

              {/* Editable Name Field */}
              <div className="w-full mb-5 text-center">
                {isEditingName ? (
                  <form onSubmit={handleUpdateName} className="flex flex-col items-center gap-2 w-full">
                    <div className="relative w-full flex items-center">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-[#181818] border border-[#8B5CF6] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] font-medium"
                        placeholder="Enter full name"
                        disabled={isUpdating}
                        autoFocus
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="p-1 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 text-[#C084FC] rounded transition-all"
                          title="Save"
                        >
                          {isUpdating ? (
                            <div className="w-3.5 h-3.5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(false)}
                          disabled={isUpdating}
                          className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded transition-all"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {updateError && (
                      <span className="text-[10px] text-rose-400 font-medium">{updateError}</span>
                    )}
                  </form>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 group">
                    <h4 className="text-base font-bold text-white tracking-tight">{profile.full_name || "User"}</h4>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-all"
                      title="Edit Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email Row */}
              <div className="w-full bg-[#161616] border border-white/5 rounded-lg p-3.5 flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Primary Email</p>
                  <p className="text-xs text-zinc-300 truncate font-medium">{profile.email}</p>
                </div>
              </div>

              {/* Status Row */}
              <div className="w-full bg-[#161616] border border-white/5 rounded-lg p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Account Security</p>
                  <p className="text-xs text-[#8B5CF6] font-bold flex items-center gap-1">
                    {isDemoMode ? "Local Offline Session" : "Cloud Synchronized"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer with Sign out */}
            <div className="px-6 py-4 bg-[#161616] border-t border-white/5 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-xs font-semibold border border-rose-500/20 hover:border-transparent transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Memora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
