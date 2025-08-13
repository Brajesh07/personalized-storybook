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
    if (data.childAge < 0 || data.childAge > 12) {
      setError('Age must be between 0 and 12');
      return;
    }
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
    <main className="min-h-screen bg-gradient-to-br from-[#FF9B4A] via-[#7DD3DC] to-[#F5F5F5] flex flex-col items-center justify-start py-10 px-4">
      {/* Hero Section */}
      <section className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-lg p-10 flex flex-col items-center mb-10 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#FF9B4A] rounded-full opacity-30 blur-2xl" />
        <h1
          className="text-4xl font-extrabold uppercase text-[#2D2D2D] text-center mb-4 tracking-wide"
          style={{ letterSpacing: '0.04em' }}
        >
          Welcome to KIDOZ
        </h1>
        <p className="text-lg font-medium text-[#2D2D2D] text-center mb-2">
          Create a{' '}
          <span className="font-bold text-[#FF9B4A]">
            personalized storybook
          </span>{' '}
          for your child!
        </p>
        <p className="text-base text-[#2D2D2D] text-center mb-6">
          Upload your child’s photo, enter their details, and generate a magical
          PDF storybook designed just for them.
        </p>
        {error && (
          <p className="text-red-600 mb-4 text-center font-semibold">{error}</p>
        )}
        <StoryForm onSubmit={handleGenerate} />
      </section>

      {/* PDF Preview Section */}
      {pdfUrl && (
        <section className="w-full max-w-2xl bg-[#F5F5F5] rounded-3xl shadow-md p-8 flex flex-col items-center mt-6 border border-[#7DD3DC]">
          <h2 className="text-2xl font-bold text-[#2D2D2D] mb-4 text-center">
            Your Storybook is Ready!
          </h2>
          <iframe
            src={pdfUrl}
            className="w-full h-[500px] border-2 border-[#7DD3DC] rounded-xl bg-white"
            title="Generated Story PDF"
          />
          <a
            href={pdfUrl}
            download="story.pdf"
            className="mt-6 inline-block px-6 py-3 bg-[#FF9B4A] text-white font-bold rounded-full shadow hover:bg-[#e88a3c] transition-colors text-lg uppercase tracking-wide"
          >
            Download PDF
          </a>
        </section>
      )}
    </main>
  );
}
