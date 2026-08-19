"use client"

import { useState } from "react"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

interface Step2Props {
  onNext: () => void
}

export function OnboardingStep2({ onNext }: Step2Props) {
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏒</span>
        </div>
        <h1 className="text-2xl font-bold text-text">HockeyLink</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center gap-2 mb-8">
        <div className="w-2 h-2 rounded-full bg-border"></div>
        <div className="w-2 h-2 rounded-full bg-accent"></div>
        <div className="w-2 h-2 rounded-full bg-border"></div>
      </div>

      {/* Auth Mode Tabs */}
      <div className="flex gap-2 mb-6 bg-surface rounded-lg p-1">
        <button
          onClick={() => setAuthMode("signup")}
          className={`flex-1 py-2 rounded transition-colors font-semibold text-sm ${
            authMode === "signup" ? "bg-accent text-primary" : "text-text-secondary hover:text-text"
          }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => setAuthMode("signin")}
          className={`flex-1 py-2 rounded transition-colors font-semibold text-sm ${
            authMode === "signin" ? "bg-accent text-primary" : "text-text-secondary hover:text-text"
          }`}
        >
          Sign In
        </button>
      </div>

      {/* Social Auth Buttons */}
      <div className="space-y-3 mb-6">
        <button className="w-full py-3 rounded-lg border border-border bg-surface hover:bg-surface-light transition-colors flex items-center justify-center gap-3 text-text font-medium">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <button className="w-full py-3 rounded-lg border border-border bg-surface hover:bg-surface-light transition-colors flex items-center justify-center gap-3 text-text font-medium">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17.05 13.5c0-1.08.04-2.12.27-3.12H12v5.93h2.97c-.23 1.47-1.47 3.15-3.22 3.95v2.8h2.1c1.72-1.63 2.71-4.04 2.71-6.76z"
              fill="currentColor"
            />
            <path
              d="M12 24c2.19 0 4.01-.72 5.35-1.95l-2.1-2.8c-.74.48-1.66.75-3.25.75-2.48 0-4.6-1.67-5.35-3.93H4.4v2.88c1.35 2.62 4.04 4.05 7.6 4.05z"
              fill="currentColor"
            />
            <path
              d="M6.65 16.37c-.36-.92-.56-1.86-.56-2.87s.2-1.95.56-2.87V7.75H4.4c-.46.95-.72 1.97-.72 3.05s.26 2.1.72 3.05l2.25 1.75z"
              fill="currentColor"
            />
            <path
              d="M12 4.75c1.41 0 2.67.48 3.66 1.39l2.75-2.75C16.01 1.32 14.19 0 12 0 8.44 0 5.75 1.43 4.4 3.75L6.65 5.5c.75-2.26 2.87-3.75 5.35-3.75z"
              fill="currentColor"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-xs text-text-secondary">OR</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      {/* Email & Password Form */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onNext}
        className="w-full py-3 rounded-lg bg-accent hover:bg-accent-dark text-primary font-semibold transition-colors mb-4"
      >
        {authMode === "signup" ? "Create Account" : "Sign In"}
      </button>

      {/* Footer */}
      {authMode === "signin" && (
        <button className="w-full text-center text-accent hover:text-accent-bright transition-colors text-sm font-medium">
          Forgot Password?
        </button>
      )}

      {authMode === "signup" && (
        <p className="text-center text-xs text-text-secondary">
          By signing up, you agree to our{" "}
          <Link href="#" className="text-accent hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-accent hover:underline">
            Privacy Policy
          </Link>
        </p>
      )}
    </div>
  )
}
