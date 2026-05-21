"use client";

import { useTranslations } from "next-intl";
import { Club, ClubMember } from "@/types/models/club";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ClubMembersSectionProps {
  club: Club;
}

export function ClubMembersSection({ club }: ClubMembersSectionProps) {
  const t = useTranslations("clubs.detail");

  if (!club.members || club.members.length === 0) return null;

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "active") return "bg-green-500/20 text-green-700";
    if (statusLower === "inactive") return "bg-gray-500/20 text-gray-700";
    return "bg-blue-500/20 text-blue-700";
  };

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === "coach") return "bg-purple-500/20 text-purple-700";
    if (roleLower === "manager") return "bg-orange-500/20 text-orange-700";
    if (roleLower === "player") return "bg-cyan-500/20 text-cyan-700";
    return "bg-slate-500/20 text-slate-700";
  };

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-foreground mb-8">
        {t("squad")} ({club.members.length})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {club.members.map((member: ClubMember) => (
          <div
            key={member.id}
            className="group relative bg-background border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                    <AvatarImage
                      src={member.user.avatar}
                      alt={member.user.name}
                    />
                    <AvatarFallback>
                      {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {member.status && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="text-center">
                <h3 className="font-semibold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                  {member.user.name}
                </h3>
                <p className="text-sm text-foreground/60">
                  @{member.user.username}
                </p>
              </div>

              {/* Position */}
              {member.user.position && (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/80">
                    {member.user.position}
                  </p>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge className={getRoleColor(member.role)}>
                  {member.role}
                </Badge>
                {member.status && (
                  <Badge className={getStatusColor(member.status)}>
                    {member.status}
                  </Badge>
                )}
              </div>

              {/* Joined date */}
              {member.joinedAt && (
                <div className="text-center pt-2 border-t border-border/50">
                  <p className="text-xs text-foreground/50">
                    {t("joinedSince")}{" "}
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
