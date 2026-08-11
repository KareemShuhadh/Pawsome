import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useState } from "react";

export const Navbar = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    cn(
      "px-4 py-2 rounded-full font-bold text-sm transition-bounce block",
      isActive
        ? "bg-primary text-primary-foreground shadow-glow"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    );

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="text-2xl font-bold">
          <span className="text-primary">Paw</span>some
        </NavLink>

        {isMobile ? (
          <>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-secondary text-2xl"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
            {menuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-2 shadow-card">
                <NavLink to="/" className={linkClass} onClick={() => setMenuOpen(false)}>Home</NavLink>
                <NavLink to="/add" className={linkClass} onClick={() => setMenuOpen(false)}>Add Dog</NavLink>
                <NavLink to="/my-posts" className={linkClass} onClick={() => setMenuOpen(false)}>My Posts</NavLink>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink to="/" className={linkClass}>Home</NavLink>
            <NavLink to="/add" className={linkClass}>Add Dog</NavLink>
            <NavLink to="/my-posts" className={linkClass}>My Posts</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
};