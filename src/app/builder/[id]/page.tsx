// app/builder/[id]/page.tsx
import React, { Suspense } from "react";
import Builder from "../Builder";

export default async function BuilderWithIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Await params before using

  return (
    <Suspense fallback={<div className="text-white p-4">Loading builder...</div>}>
      <Builder id={id} />
    </Suspense>
  );
}