import { Suspense } from "react";
import { ClubsPage } from "@/components/pages/clubs-page";
import { Loader } from "@/components/ui/loader";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_CLUBS } from "@/graphql/club/queries";

export default async function ClubsRoute() {
  let initialData = { clubs: [] };

  try {
    const data = await graphqlClient.request(GET_CLUBS);
    if (data?.clubs && Array.isArray(data.clubs)) {
      initialData = data;
    }
  } catch (error) {
    console.error("Error fetching clubs in SSR:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader />
        </div>
      }
    >
      <ClubsPage initialData={initialData} />
    </Suspense>
  );
}
