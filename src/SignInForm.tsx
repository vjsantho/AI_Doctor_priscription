import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-2xl font-display font-bold text-white mb-2 text-center">
        {flow === "signIn" ? "Welcome Back" : "Create Account"}
      </h2>
      <p className="text-text-muted text-center mb-8 text-sm">
        {flow === "signIn" ? "Enter your details to access your dashboard" : "Start your journey with Medical AI"}
      </p>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="w-full px-4 py-3 rounded-lg bg-section-dark border border-white/10 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="w-full px-4 py-3 rounded-lg bg-section-dark border border-white/10 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button
          className="w-full px-4 py-3 rounded-lg bg-primary text-text-main font-semibold hover:bg-blue-600 transition-all duration-300 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={submitting}
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>

        <div className="text-center text-sm text-text-muted mt-2">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-blue-400 hover:underline font-medium cursor-pointer transition-colors"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-center my-6">
        <hr className="grow border-white/10" />
        <span className="mx-4 text-text-muted text-xs uppercase tracking-widest">or</span>
        <hr className="grow border-white/10" />
      </div>

      <button
        className="w-full px-4 py-3 rounded-lg bg-section-dark border border-white/10 text-text-muted hover:text-white hover:bg-section-darker transition-all duration-300 text-sm font-medium"
        onClick={() => void signIn("anonymous")}
      >
        Continue as Guest
      </button>
    </div>
  );
}
