"use client";

import { useState } from "react";
import { ClubProfileHeader } from "@/components/profile/club-profile-header";
import { ClubProfileTabs } from "@/components/profile/club-profile-tabs";
import { useAuthStore } from "@/stores/useAuthStore";

interface ClubProfilePageProps {
  isOwnProfile?: boolean;
}

export function ClubProfilePage({
  isOwnProfile = false,
}: ClubProfilePageProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const { user } = useAuthStore();

  if (!user) {
    return <div>PLEASE LOGIN</div>;
  }

  const anyUser = user as unknown as Record<string, unknown>;

  const clubData = {
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar || "/user.png",
    coverImage: user.coverImage || "",
    bio: user.bio,
    city: user.city,
    country: user.country,
    isVerified: anyUser.isVerified as boolean | undefined,
    memberCount: (anyUser.memberCount as number | undefined),
    website: anyUser.website as string | undefined,
    email: user.email,
    league: anyUser.league as string | undefined,
    type: anyUser.type as string | undefined,
    createdAt: user.createdAt,
    videos: anyUser.videos as string[] | undefined,
    isAdmin: isOwnProfile,
  };

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
        isOwnProfile={isOwnProfile}
        memberCount={clubData.memberCount}
      />
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
          isAdmin: clubData.isAdmin,
        }}
      />
    </main>
  );
}
