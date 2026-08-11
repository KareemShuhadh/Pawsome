import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, ArrowLeft } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  // TODO: Connect to Supabase Auth signUp()
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Register attempt:", form);
    alert("Registration system coming soon! 🔧");
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
            Join the pack! 🐶
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Create an account to save your posts forever
          </p>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Your name</Label>
              <Input
                id="reg-name"
                placeholder="Alex"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">Email address</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-warm text-primary-foreground font-bold shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
              <UserPlus className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already a member?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}