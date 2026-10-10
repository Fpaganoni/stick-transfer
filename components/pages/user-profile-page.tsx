"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMe } from "@/hooks/useUsers";
import { Role } from "@/types/enums";

interface UserProfilePageProps {
  isOwnProfile?: boolean;
}

export function UserProfilePage({
  isOwnProfile = false,
}: UserProfilePageProps) {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const { user: authUser } = useAuthStore();
  const { data: freshData } = useMe();

  const user = freshData?.me ?? authUser;

  if (!user) {
    return <div>PLEASE LOGIN</div>;
  }

  // Umpires land on their officiating data; everyone else on trajectory
  const activeTab =
    selectedTab ?? (user.role === Role.UMPIRE ? "umpire" : "trajectory");

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
    isVerified: user.isVerified,
    licenseLevel: user.licenseLevel,
    coverImagePosition: user.coverImagePosition || "50%",
    trajectories:
      user.trajectories?.map((t) => ({
        club: t.club,
        period: t.period,
        description: t.description,
        title: t.title,
      })) || [],
    multimedia: user.multimedia || [],
    umpire: {
      licenseLevel: user.licenseLevel,
      certifyingBody: user.certifyingBody,
      licenseNumber: user.licenseNumber,
      certificationYear: user.certificationYear,
      matchesOfficiated: user.matchesOfficiated,
      yearsOfExperience: user.yearsOfExperience,
      travelAvailability: user.travelAvailability,
      languages: user.languages,
      modalities: user.modalities,
      umpireCategories: user.umpireCategories,
      umpireCertifications: user.umpireCertifications,
    },
  };

  return (
    <main className="bg-overlay max-w-5xl mx-auto pb-24">
      <ProfileHeader
          {...userData}
          isOwnProfile={isOwnProfile}
          followersCount={user.followersCount}
          followingCount={user.followingCount}
        />
      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setSelectedTab}
        userData={userData}
        isOwnProfile={isOwnProfile}
      />
    </main>
  );
}
