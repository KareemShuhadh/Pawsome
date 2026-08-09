// src/components/Navbar.jsx
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const linkClass = ({ isActive }) =>
    cn(
      "px-4 py-2 rounded-full font-bold text-sm transition-bounce",
      isActive
        ? "bg-primary text-primary-foreground shadow-glow"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    );

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="text-2xl font-bold font-display">
          <span className="text-primary">Paw</span>some
        </NavLink>
        
        <div className="flex items-center gap-2">
          <NavLink to="/" className={linkClass}>Home</NavLink>
          <NavLink to="/add" className={linkClass}>Add Dog</NavLink>
          <NavLink to="/my-posts" className={linkClass}>My Posts</NavLink>
        </div>
      </div>
    </nav>
  );
};