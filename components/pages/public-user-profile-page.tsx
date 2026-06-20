"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { useUserByUsername } from "@/hooks/useUsers";
import { Loader } from "@/components/ui/loader";
import { Error } from "@/components/ui/error";

interface PublicUserProfilePageProps {
  username: string;
}

export function PublicUserProfilePage({
  username,
}: PublicUserProfilePageProps) {
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
        <Error>User not found</Error>
      </div>
    );
  }

  const user = data.getUserByUsername;

  const userData = {
    id: user.id,
    name: user.name,
    role: user.role,
    position: user.position,
    country: user.country || "🌍",
    avatar: user.avatar || "/user.png",
    coverImage: user.coverImage || "",
    bio: user.bio,
    cvUrl: user.cvUrl,
    coverImagePosition: user.coverImagePosition || "50%",
    trajectories:
      user.trajectories?.map((t) => ({
        club: t.club,
        period: t.period,
        description: t.description,
        title: t.title,
      })) || [],
    multimedia: user.multimedia || [],
  };

  return (
    <main className="bg-overlay max-w-4xl mx-auto pb-24">
      <ProfileHeader
          {...userData}
          isOwnProfile={false}
          username={user.username}
          followers={user.followers || []}
          following={user.following || []}
        />
      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userData={userData}
      />
    </main>
  );
}
