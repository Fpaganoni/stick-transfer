"use client";

import { useState } from "react";
import { ClubProfileHeader } from "@/components/profile/club-profile-header";
import { ClubProfileTabs } from "@/components/profile/club-profile-tabs";
import { useUserByUsername } from "@/hooks/useUsers";
import { Loader } from "@/components/ui/loader";
import { Error } from "@/components/ui/error";

interface PublicClubProfilePageProps {
  username: string;
}

export function PublicClubProfilePage({ username }: PublicClubProfilePageProps) {
  const [activeTab, setActiveTab] = useState("posts");
  const { data, isLoading, error } = useUserByUsername(username);

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

  const clubData = {
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar || "/user.png",
    coverImage: user.coverImage || "",
    bio: user.bio,
    city: user.city,
    country: user.country || "🌍",
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
        isOwnProfile={false}
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
