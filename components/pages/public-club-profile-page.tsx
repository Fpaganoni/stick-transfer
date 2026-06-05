"use client";

import { useState } from "react";
import { ClubProfileHeader } from "@/components/profile/club-profile-header";
import { ClubProfileTabs } from "@/components/profile/club-profile-tabs";
import { useUserByUsername } from "@/hooks/useUsers";
import { useAuthStore } from "@/stores/useAuthStore";
import { Loader } from "@/components/ui/loader";
import { Error } from "@/components/ui/error";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Users, Briefcase, MessageCircle, Star } from "lucide-react";

interface PublicClubProfilePageProps {
  username: string;
}

export function PublicClubProfilePage({ username }: PublicClubProfilePageProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const { data, isLoading, error } = useUserByUsername(username);
  const { isLoggedIn } = useAuthStore();
  const t = useTranslations("clubProfile");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (error || !data?.getUserByUsername) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Error>Club not found</Error>
      </div>
    );
  }

  const user = data.getUserByUsername;
  const anyUser = user as unknown as Record<string, unknown>;

  const clubData = {
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar || "/user.png",
    coverImage: user.coverImage || "",
    bio: user.bio,
    city: user.city,
    country: user.country || "🌍",
    isVerified: anyUser.isVerified as boolean | undefined,
    memberCount: anyUser.memberCount as number | undefined,
    website: anyUser.website as string | undefined,
    email: user.email,
    league: anyUser.league as string | undefined,
    type: anyUser.type as string | undefined,
    createdAt: user.createdAt,
    videos: anyUser.videos as string[] | undefined,
  };

  const visitorItems = [
    { icon: Users, key: "visitor.item1" as const },
    { icon: Briefcase, key: "visitor.item2" as const },
    { icon: MessageCircle, key: "visitor.item3" as const },
    { icon: Star, key: "visitor.item4" as const },
  ];

  return (
    <main className="bg-overlay max-w-4xl mx-auto pb-24">
      <ClubProfileHeader
        id={clubData.id}
        name={clubData.name}
        role={clubData.role}
        avatar={clubData.avatar}
        coverImage={clubData.coverImage}
        bio={clubData.bio}
        city={clubData.city}
        country={clubData.country}
        isVerified={clubData.isVerified}
        isOwnProfile={false}
        memberCount={clubData.memberCount}
      />

      {!isLoggedIn && (
        <div className="mx-4 my-4 bg-surface border border-border rounded-xl p-6 text-center">
          <h2 className="text-foreground font-bold text-lg mb-1">
            {t("visitor.title", { name: clubData.name })}
          </h2>
          <p className="text-foreground-muted text-sm mb-4">
            {t("visitor.subtitle")}
          </p>
          <ul className="space-y-2 mb-5 text-left max-w-xs mx-auto">
            {visitorItems.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-2 text-foreground text-sm">
                <Icon size={16} className="text-primary flex-shrink-0" />
                {t(key)}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-5 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
            >
              {t("visitor.createAccount")}
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 border border-border text-foreground rounded-lg hover:bg-surface-elevated transition-colors text-sm"
            >
              {t("visitor.logIn")}
            </Link>
          </div>
        </div>
      )}

      <ClubProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clubData={{
          id: clubData.id,
          bio: clubData.bio,
          city: clubData.city,
          country: clubData.country,
          website: clubData.website,
          email: clubData.email,
          league: clubData.league,
          type: clubData.type,
          createdAt: clubData.createdAt,
          videos: clubData.videos,
          isAdmin: false,
        }}
      />
    </main>
  );
}
