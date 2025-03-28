import React, { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateSummary } from '../utils/gemini';

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: {
    section_number: string;
    chapter: string;
    section_title: string;
    content: string;
  };
}

export default function SectionModal({ isOpen, onClose, section }: SectionModalProps) {
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const summaryText = await generateSummary(section.content);
      setSummary(summaryText);
      toast.success('Summary generated successfully!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Section {section.section_number}</h2>
            <p className="text-sm text-gray-500">Chapter {section.chapter}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <h3 className="text-xl font-semibold mb-4">{section.section_title}</h3>
          <p className="text-gray-600 mb-6">{section.content}</p>
          
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">AI Summary</h4>
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSummarizing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Summarize
              </button>
            </div>
            
            {summary ? (
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-gray-700">{summary}</p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Click summarize to generate an AI summary of this section
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
