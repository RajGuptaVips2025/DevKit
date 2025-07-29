// app/builder/page.tsx
import React, { Suspense } from 'react';
import Builder from './Builder';

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="text-white p-4">Loading builder...</div>}>
      <Builder />
    </Suspense>
  );
}
