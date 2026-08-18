import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { LogIn, UserPlus, LogOut, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Navbar = () => {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const linkClass = ({ isActive }) =>
    cn(
      "px-4 py-2 rounded-full font-bold text-sm transition-bounce block",
      isActive ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    );

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="text-2xl font-bold">
          <span className="text-primary">Paw</span>some
        </NavLink>

        {isMobile ? (
          <>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-secondary text-2xl">
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
            {menuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-2 shadow-card">
                <NavLink to="/" className={linkClass} onClick={() => setMenuOpen(false)}>Home</NavLink>
                <NavLink to="/add" className={linkClass} onClick={() => setMenuOpen(false)}>Add Dog</NavLink>
                <NavLink to="/my-posts" className={linkClass} onClick={() => setMenuOpen(false)}>My Posts</NavLink>
                
                {user ? (
                  <button onClick={handleLogout} disabled={loggingOut} className="px-4 py-2 rounded-full font-bold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-bounce flex items-center justify-center gap-2">
                    {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Logout
                  </button>
                ) : (
                  <>
                    <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}><LogIn className="w-4 h-4 inline mr-1" /> Login</NavLink>
                    <NavLink to="/register" className="px-4 py-2 rounded-full font-bold text-sm bg-gradient-warm text-primary-foreground shadow-glow text-center" onClick={() => setMenuOpen(false)}><UserPlus className="w-4 h-4 inline mr-1" /> Join</NavLink>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink to="/" className={linkClass}>Home</NavLink>
            <NavLink to="/add" className={linkClass}>Add Dog</NavLink>
            <NavLink to="/my-posts" className={linkClass}>My Posts</NavLink>
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm font-bold text-muted-foreground hidden md:inline">{user.email}</span>
                <button onClick={handleLogout} disabled={loggingOut} className="px-4 py-2 rounded-full font-bold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-bounce flex items-center gap-1.5">
                  {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Logout
                </button>
              </div>
            ) : (
              <>
                <div className="w-px h-6 bg-border mx-1" />
                <NavLink to="/login" className="px-4 py-2 rounded-full font-bold text-sm border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-bounce flex items-center gap-1.5">
                  <LogIn className="w-4 h-4" /> Login
                </NavLink>
                <NavLink to="/register" className="px-4 py-2 rounded-full font-bold text-sm bg-gradient-warm text-primary-foreground shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Join
                </NavLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};