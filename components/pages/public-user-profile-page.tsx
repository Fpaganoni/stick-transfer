"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { useUserByUsername } from "@/hooks/useUsers";
import { Loader } from "@/components/ui/loader";
import { Error } from "@/components/ui/error";
import { Role } from "@/types/enums";

interface PublicUserProfilePageProps {
  username: string;
}

export function PublicUserProfilePage({
  username,
}: PublicUserProfilePageProps) {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
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

  // Umpires land on their officiating data; everyone else on trajectory
  const activeTab =
    selectedTab ?? (user.role === Role.UMPIRE ? "umpire" : "trajectory");

  const userData = {
    id: user.id,
    name: user.name,
    role: user.role,
    position: user.position,
    country: user.country || undefined,
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
        setActiveTab={setSelectedTab}
        userData={userData}
      />
    </main>
  );
}
