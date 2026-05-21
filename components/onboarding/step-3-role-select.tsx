"use client"

import { useRouter } from "next/navigation"
import { Users, Users2, Building2, ChevronRight } from "lucide-react"

interface Step3Props {
  onNext: () => void
}

export function OnboardingStep3({ }: Step3Props) {
  const router = useRouter()

  const roles = [
    {
      id: "player",
      label: "Player",
      description: "Find clubs, opportunities, and connect with teammates",
      icon: Users,
    },
    {
      id: "coach",
      label: "Coach",
      description: "Recruit talent, build your team, and manage players",
      icon: Users2,
    },
    {
      id: "club",
      label: "Club",
      description: "Post opportunities and build your organization",
      icon: Building2,
    },
  ]

  const handleRoleSelect = (roleId: string) => {
    // Save role and redirect to home
    localStorage.setItem("userRole", roleId)
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <h1 className="text-2xl font-bold text-text mb-2">Select Your Role</h1>
        <p className="text-text-secondary text-sm">Choose how you want to use HockeyLink</p>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center gap-2 mb-12">
        <div className="w-2 h-2 rounded-full bg-border"></div>
        <div className="w-2 h-2 rounded-full bg-border"></div>
        <div className="w-2 h-2 rounded-full bg-accent"></div>
      </div>

      {/* Role Selection Cards */}
      <div className="space-y-3 flex-1">
        {roles.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleRoleSelect(id)}
            className="w-full p-4 rounded-lg border-2 border-border bg-surface hover:border-accent-bright hover:bg-surface-light transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                <Icon size={24} className="text-accent-bright" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-text mb-1">{label}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
              </div>
              <ChevronRight
                size={20}
                className="text-text-secondary group-hover:text-accent transition-colors flex-shrink-0 mt-1"
              />
            </div>
          </button>
        ))}
      </div>

      {/* Footer Note */}
      <p className="text-center text-xs text-text-secondary mt-8">You can change your role anytime in settings</p>
    </div>
  )
}
