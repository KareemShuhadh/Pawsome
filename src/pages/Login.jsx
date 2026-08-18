import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { LogIn, ArrowLeft, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-bold mb-6 transition-smooth">
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </Link>

        <Card className="p-8 shadow-card border-2 border-border/60">
          <h1 className="text-3xl font-bold mb-2 text-center">Welcome back! 🐾</h1>
          <p className="text-muted-foreground text-center mb-8">Sign in to manage your posts</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-warm text-primary-foreground font-bold rounded-xl shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : <><LogIn className="w-5 h-5" /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            No account? <Link to="/register" className="text-primary font-bold hover:underline">Join the pack</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}