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
  const [activeTab, setActiveTab] = useState("posts");
  const { user } = useAuthStore();

  if (!user) {
    return <div>PLEASE LOGIN</div>;
  }

  const clubData = {
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar || "/user.png",
    coverImage: user.coverImage || "",
    bio: user.bio,
    city: user.city,
    country: user.country,
    isVerified: (user as unknown as { isVerified?: boolean }).isVerified,
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
      />
      <ClubProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clubData={{
          id: clubData.id,
          bio: clubData.bio,
          city: clubData.city,
          country: clubData.country,
        }}
      />
    </main>
  );
}
