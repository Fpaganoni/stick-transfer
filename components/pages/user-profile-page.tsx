"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUser } from "@/hooks/useUsers";

interface UserProfilePageProps {
  isOwnProfile?: boolean;
}

export function UserProfilePage({
  isOwnProfile = false,
}: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState("trajectory");
  const { user: authUser } = useAuthStore();
  const { data: freshData } = useUser(authUser?.id ?? null);

  const user = freshData?.user ?? authUser;

  if (!user) {
    return <div>PLEASE LOGIN</div>;
  }

  const userData = {
    id: user.id,
    name: user.name,
    role: user.role,
    position: user.position,
    country: user.country,
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
    <main className="bg-overlay max-w-5xl mx-auto pb-24">
      <ProfileHeader
          {...userData}
          isOwnProfile={isOwnProfile}
          followers={user.followers || []}
          following={user.following || []}
        />
      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userData={userData}
        isOwnProfile={isOwnProfile}
      />
    </main>
  );
}
