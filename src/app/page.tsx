// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { StoryForm, StoryFormInputs } from '@/components/forms/StoryForm';
import { compressImage } from '@/lib/imageUtils';

export default function HomePage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (data: StoryFormInputs) => {
    setPdfUrl(null);

    // Age guard
    if (data.childAge < 0 || data.childAge > 12) {
      setError('Age must be between 0 and 12');
      return;
    }

    // Convert and compress photos
    const photosArray = Array.from(data.photos);
    const dataUrls = await Promise.all(
      photosArray.map((file) => compressImage(file as Blob))
    );

    const res = await fetch('/api/create-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, photos: dataUrls }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Personalized Storybook</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <StoryForm onSubmit={handleGenerate} />

      {pdfUrl && (
        <div className="mt-10">
          <iframe
            src={pdfUrl}
            className="w-full h-[600px] border rounded"
            title="Generated Story PDF"
          />
          <a
            href={pdfUrl}
            download="story.pdf"
            className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded"
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
}
