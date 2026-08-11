import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO: Connect to Supabase Auth (Magic Link or Password)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder: await supabase.auth.signInWithOtp({ email })
    console.log("Login attempt:", email);
    alert("Login system coming soon! 🔧");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-bold mb-6 transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </Link>

        <Card className="p-8 shadow-card border-2 border-border/60">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Welcome back! 🐾
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Sign in to manage your posts across devices
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* TODO: Add password field if using email+password auth */}
            {/* <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div> */}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-warm text-primary-foreground font-bold shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce"
              disabled={loading}
            >
              {loading ? "Sending magic link..." : "Send Magic Link"}
              <Mail className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Join the pack
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}