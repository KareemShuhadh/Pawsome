import { useState } from "react";

import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { useAuth } from "@/context/AuthContext";

import {
  UserPlus,
  ArrowLeft,
  Loader2,
  Mail,
  Check,
} from "lucide-react";

import { Notification } from "@/components/Notification";

export default function Register() {
  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [sent, setSent] = useState(false);

  const [notification, setNotification] =
    useState(null);

  const { signUp } = useAuth();

  // Password requirements

  const hasMinLength = password.length >= 8;

  const hasUppercase = /[A-Z]/.test(password);

  const hasLowercase = /[a-z]/.test(password);

  const hasNumber = /[0-9]/.test(password);

  const hasSymbol =
    /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(
      password
    );

  // Password strength: 0, 1, 2, or 3 bars

  const requirementsMet = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  const strength = Math.min(
    3,
    Math.floor((requirementsMet * 3) / 5)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const { error } = await signUp(
      email,
      password,
      { name }
    );

    setLoading(false);

    if (error) {
      setNotification({
        type: "error",
        message:
          "Password must include an uppercase letter, lowercase letter, number, and symbol.",
      });
    } else {
      setSent(true);
    }
  };

  // Show confirmation message after successful registration

  if (sent) {
    return (
      <main className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
        <section className="w-full max-w-md text-center">
          <figure className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-primary" />
          </figure>

          <h1 className="text-3xl font-bold mb-4">
            Check your email! 📧
          </h1>

          <p className="text-muted-foreground mb-2">
            We sent a confirmation link to:
          </p>

          <p className="font-bold text-foreground mb-6">
            {email}
          </p>

          <p className="text-sm text-muted-foreground mb-8">
            Click the link in the email to activate
            your account, then come back and sign in.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-warm text-primary-foreground font-bold shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce"
          >
            Go to Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
      <section className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-bold mb-6 transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>

        <Card className="p-8 shadow-card border-2 border-border/60">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Join the pack! 🐶
          </h1>

          <p className="text-muted-foreground text-center mb-8">
            Create an account to save your posts
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Name */}

            <fieldset className="space-y-2">
              <Label htmlFor="name">
                Your name
              </Label>

              <Input
                id="name"
                required
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Alex"
              />
            </fieldset>

            {/* Email */}

            <fieldset className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
              />
            </fieldset>

            {/* Password */}

            <fieldset className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>

              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create a strong password"
                minLength={8}
              />

              {/* Password strength */}

              <section
                className="flex gap-1.5 pt-1"
                aria-hidden="true"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-smooth ${
                      i < strength
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </section>

              {/* Password requirements */}

              <section className="pt-2 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Password must contain:
                </p>

                <PasswordRequirement
                  met={hasMinLength}
                  text="At least 8 characters"
                />

                <PasswordRequirement
                  met={hasUppercase}
                  text="One uppercase letter"
                />

                <PasswordRequirement
                  met={hasLowercase}
                  text="One lowercase letter"
                />

                <PasswordRequirement
                  met={hasNumber}
                  text="One number"
                />

                <PasswordRequirement
                  met={hasSymbol}
                  text="One symbol"
                />
              </section>
            </fieldset>

            {/* Create account */}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-warm text-primary-foreground font-bold rounded-xl shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </section>

      {/* Custom notification */}

      <Notification
        notification={notification}
        onDismiss={() =>
          setNotification(null)
        }
      />
    </main>
  );
}

/* Password requirement component */

function PasswordRequirement({ met, text }) {
  return (
    <article className="flex items-center gap-2">
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
          met ? "bg-primary" : "bg-muted"
        }`}
      >
        {met && (
          <Check className="w-3 h-3 text-primary-foreground" />
        )}
      </span>

      <span
        className={`text-xs transition-smooth ${
          met
            ? "text-primary font-medium"
            : "text-muted-foreground"
        }`}
      >
        {text}
      </span>
    </article>
  );
}