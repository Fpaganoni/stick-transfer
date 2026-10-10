"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { ProfilePageSkeleton } from "@/components/profile/profile-page-skeleton";
import { useMe, useMyFollowCounts } from "@/hooks/useUsers";
import { Role } from "@/types/enums";

interface UserProfilePageProps {
  isOwnProfile?: boolean;
}

export function UserProfilePage({
  isOwnProfile = false,
}: UserProfilePageProps) {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  // The stored user renders at once and `me` replaces it in place
  const { data } = useMe({ placeholderFromStore: true });
  const { data: counts } = useMyFollowCounts();

  const user = data?.me;

  if (!user) {
    return <ProfilePageSkeleton />;
  }

  // Placeholders (undefined) until their own query answers
  const followersCount = counts?.me.followersCount;
  const followingCount = counts?.me.followingCount;

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
          followersCount={followersCount}
          followingCount={followingCount}
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
