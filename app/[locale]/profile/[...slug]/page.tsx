import { graphqlClient } from "@/lib/graphql-client";
import { GET_USER_BY_USERNAME } from "@/graphql/user/queries";
import { Metadata } from "next";
import { ProfileSlugWrapper } from "@/components/profile/profile-slug-wrapper";

interface PublicProfileRouteProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata({ params }: PublicProfileRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const username = slug.join(".");

  try {
    const data: { getUserByUsername?: { name: string; bio?: string; avatar?: string } | null } = await graphqlClient.request(GET_USER_BY_USERNAME, { username });
    if (data?.getUserByUsername) {
      const user = data.getUserByUsername;
      return {
        title: `${user.name} (@${username}) | Hockey Social`,
        description: user.bio || `Check out ${user.name}'s hockey profile!`,
        openGraph: {
          title: `${user.name} | Hockey Social`,
          description: user.bio || `Check out ${user.name}'s hockey profile!`,
          images: [user.avatar || "/hockey-stadium.jpg"],
        },
      };
    }
  } catch (error) {
    console.error("Error generating metadata for profile", error);
  }

  return {
    title: `${username} | Hockey Social`,
  };
}

export default async function PublicProfileRoute({ params }: PublicProfileRouteProps) {
  const { slug } = await params;
  const username = slug.join(".");

  // The actual UI logic with useAuthStore is handled in a Client Component Wrapper
  return <ProfileSlugWrapper username={username} />;
}
