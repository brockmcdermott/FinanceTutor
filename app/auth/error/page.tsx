import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm">Code error: {params.error}</p>
      ) : (
        <p className="text-sm">An unspecified error occurred.</p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Sorry, something went wrong.</h1>
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
