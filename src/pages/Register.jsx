import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, ArrowLeft, Loader2, Mail } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, { name });
    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setSent(true);
    }
  };

  // Show confirmation message after successful registration
  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Check your email! 📧</h1>
          <p className="text-muted-foreground mb-2">
            We sent a confirmation link to:
          </p>
          <p className="font-bold text-foreground mb-6">{email}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Click the link in the email to activate your account, then come back and sign in.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-warm text-primary-foreground font-bold shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-bold mb-6 transition-smooth">
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </Link>

        <Card className="p-8 shadow-card border-2 border-border/60">
          <h1 className="text-3xl font-bold mb-2 text-center">Join the pack! 🐶</h1>
          <p className="text-muted-foreground text-center mb-8">Create an account to save your posts</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} />
            </div>

            <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-warm text-primary-foreground font-bold rounded-xl shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : <><UserPlus className="w-5 h-5" /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already a member? <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}