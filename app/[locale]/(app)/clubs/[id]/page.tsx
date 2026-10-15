import { Metadata } from "next";
import { ClubProfileRoute } from "@/components/clubs/club-profile-route";

interface ClubDetailRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Club | Hockey Social`,
    description: "View club details and members",
  };
}

export default async function ClubDetailRoute({
  params,
}: ClubDetailRouteProps) {
  const { id } = await params;

  return <ClubProfileRoute clubId={id} />;
}
