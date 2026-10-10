import { Suspense } from "react";
import { OpportunitiesPage } from "@/components/pages/opportunities-page";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_JOB_OPPORTUNITIES } from "@/graphql/opportunity/queries";
import { Loader } from "lucide-react";
import { JobOpportunity } from "@/types/models/job-opportunity";

export default async function OpportunitiesRoute() {
  let initialData: { jobOpportunities: JobOpportunity[] } | undefined = undefined;
  try {
    const data: { jobOpportunities: JobOpportunity[] } = await graphqlClient.request(GET_JOB_OPPORTUNITIES);
    if (data) initialData = data;
  } catch (error) {
    console.error("Failed to fetch opportunities Server Side", error);
  }

  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader className="animate-spin text-primary" /></div>}>
      <OpportunitiesPage initialData={initialData} />
    </Suspense>
  );
}
