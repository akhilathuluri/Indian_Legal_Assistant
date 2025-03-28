import React from 'react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About LegalAI</h1>
      
      <div className="prose prose-indigo max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          LegalAI is a cutting-edge platform designed to revolutionize the legal industry through artificial intelligence and machine learning technologies.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Mission</h2>
        <p className="text-gray-600 mb-6">
          To empower legal professionals with innovative AI-driven tools that enhance efficiency, accuracy, and accessibility in legal research and analysis.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Vision</h2>
        <p className="text-gray-600 mb-6">
          To become the leading AI-powered legal technology platform, making legal services more accessible and efficient for professionals worldwide.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Team</h2>
        <p className="text-gray-600 mb-6">
          We are a team of legal experts, technologists, and innovators working together to transform the legal industry through advanced technology.
        </p>
      </div>
    </div>
  );
}
