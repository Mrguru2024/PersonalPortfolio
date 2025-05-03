"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Home, Info, Briefcase, Code, Mail, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: string;
  onSectionClick: (section: string) => void;
}

export default function QuickNav({ 
  isOpen, 
  onClose, 
  currentSection,
  onSectionClick
}: QuickNavProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Navigation items with icons
  const navItems = [
    { id: "home", label: "Home", path: "/#home", icon: <Home className="h-5 w-5" /> },
    { id: "about", label: "About Me", path: "/#about", icon: <Info className="h-5 w-5" /> },
    { id: "projects", label: "Projects", path: "/#projects", icon: <Briefcase className="h-5 w-5" /> },
    { id: "skills", label: "Skills", path: "/#skills", icon: <Code className="h-5 w-5" /> },
    { id: "contact", label: "Contact", path: "/#contact", icon: <Mail className="h-5 w-5" /> },
    { id: "blog", label: "Blog", path: "/blog", icon: <BookOpen className="h-5 w-5" /> },
    { id: "resume", label: "Resume", path: "/resume", icon: <FileText className="h-5 w-5" /> },
  ];
  
  // Filter items based on search
  const filteredItems = search.trim() === ""
    ? navItems
    : navItems.filter(item => 
        item.label.toLowerCase().includes(search.toLowerCase())
      );

  // Handle item click
  const handleItemClick = (item: { id: string; path: string }) => {
    if (item.path.startsWith('/#')) {
      onSectionClick(item.id);
    } else {
      router.push(item.path);
    }
    onClose();
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg border border-border">
        {/* Header with search */}
        <div className="flex items-center border-b border-border p-4">
          <Search className="h-5 w-5 text-muted-foreground mr-2" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search navigation..."
            className="flex-1 bg-transparent border-none outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation items */}
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {filteredItems.length > 0 ? (
            <ul>
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-md text-left",
                      "hover:bg-accent transition-colors",
                      item.id === currentSection && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="text-muted-foreground">{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.id === "home" && "Alt+1"}
                      {item.id === "about" && "Alt+2"}
                      {item.id === "projects" && "Alt+3"}
                      {item.id === "skills" && "Alt+4"}
                      {item.id === "contact" && "Alt+5"}
                      {item.id === "blog" && "Alt+B"}
                      {item.id === "resume" && "Alt+R"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              <p>No results found</p>
            </div>
          )}
        </div>
        
        {/* Footer with keyboard shortcuts */}
        <div className="border-t border-border p-4 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">Tip:</span> Press <kbd className="px-2 py-1 text-xs bg-muted rounded">Esc</kbd> to close, 
            or use Alt+number shortcuts to navigate directly.
          </p>
        </div>
      </div>
    </div>
  );
}