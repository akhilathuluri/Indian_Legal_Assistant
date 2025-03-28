import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Loader2, History, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Document } from '../lib/supabase';
import toast from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist/webpack';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useFileUpload } from '../hooks/useFileUpload';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export default function DocumentAnalysis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [savedDocuments, setSavedDocuments] = useState<Document[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { upload, isUploading, progress } = useFileUpload({
    bucket: 'documents',
    allowedTypes: ['application/pdf', 'text/plain'],
    maxSizeMB: 10
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchDocuments = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load document history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchDocuments();
    }
  }, [showHistory, user]);

  const checkNameAvailability = async (name: string) => {
    if (!user || !name.trim()) {
      setIsNameValid(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', name.trim())
        .maybeSingle();

      if (error) throw error;
      setIsNameValid(!data);
    } catch (error) {
      console.error('Error checking name availability:', error);
      setIsNameValid(false);
    }
  };

  useEffect(() => {
    checkNameAvailability(documentName);
  }, [documentName]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF. Please make sure the file is a valid PDF document.');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      toast.error('Please upload a PDF or text file');
      return;
    }

    setSelectedFile(file);
    setDocumentName(file.name.replace(/\.[^/.]+$/, '')); // Set initial name from filename without extension
  }, []);

  const processDocument = async () => {
    if (!user || !selectedFile || !documentName.trim() || !isNameValid) {
      toast.error('Please provide a valid document name');
      return;
    }

    setIsProcessing(true);
    try {
      // Extract text from file first to ensure it's valid
      let text = '';
      try {
        if (selectedFile.type === 'text/plain') {
          text = await selectedFile.text();
        } else {
          text = await extractTextFromPDF(selectedFile);
        }

        if (!text.trim()) {
          throw new Error('No text could be extracted from the document');
        }
      } catch (error: any) {
        throw new Error(`Failed to extract text: ${error.message}`);
      }

      setExtractedText(text);

      // Upload file to Supabase storage
      const publicUrl = await upload(selectedFile, user.id);

      // Analyze the text using Google AI
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analyze the following legal document from an Indian law perspective. Provide a structured analysis including:
      1. Category of the Case
      2. Relevant Sections to Handle
      3. Key Points to Win the Case
      4. Similar Previous Cases (with links if available)
      5. Overall Summary

      Document Text: ${text}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const legalAnalysis = response.text();
      setAnalysis(legalAnalysis);

      // Save to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: documentName.trim(),
          file_url: publicUrl,
          file_type: selectedFile.type,
          extracted_text: text,
          analysis: legalAnalysis
        });

      if (dbError) throw dbError;

      if (showHistory) {
        fetchDocuments();
      }

      toast.success('Document analyzed successfully!');
      setDocumentName('');
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error processing document:', error);
      toast.error(error.message || 'Error processing document');
      
      // Clean up on error
      setExtractedText('');
      setAnalysis('');
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Document Analysis</h1>
        <p className="text-gray-600 mb-6">Upload and analyze legal documents</p>

        <div className="mb-6">
          <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 mb-2">
            Document Name
          </label>
          <input
            type="text"
            id="documentName"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="Enter a unique name for this document"
            className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${
              documentName && !isNameValid
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
          {documentName && !isNameValid && (
            <p className="mt-1 text-sm text-red-600">
              This name is already taken. Please choose a different name.
            </p>
          )}
        </div>

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
        >
          <input {...getInputProps()} />
          <FileText className="mx-auto h-12 w- 12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? (
              "Drop the file here"
            ) : (
              "Drag and drop a PDF or text file here, or click to select"
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PDF, TXT
          </p>
        </div>

        {selectedFile && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Selected file: {selectedFile.name}
            </p>
            <button
              onClick={processDocument}
              disabled={isProcessing || !documentName.trim() || !isNameValid}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Process Document
                </>
              )}
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="mt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Processing your document...</p>
          </div>
        )}

        {extractedText && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Extracted Text</h3>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[60vh]">
              <p className="text-gray-700 whitespace-pre-wrap">{extractedText}</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Legal Analysis</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <MarkdownRenderer content={analysis} />
            </div>
          </div>
        )}

        <div className="border-t mt-6 sm:mt-8 pt-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <History className="h-5 w-5 mr-2" />
            {showHistory ? 'Hide History' : 'Show History'}
            {showHistory ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>

          {showHistory && (
            <div className="mt-4 space-y-4">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : savedDocuments.length > 0 ? (
                <div className="space-y-4">
                  {savedDocuments.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {doc.name}
                        </h4>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {doc.file_type === 'application/pdf' ? 'PDF' : 'TXT'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Created on {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">File</h5>
                        <a 
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500 text-sm"
                        >
                          Download Document
                        </a>
                      </div>
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Extracted Text</h5>
                        <p className="text-gray-600 bg-gray-50 rounded p-3">{doc.extracted_text}</p>
                      </div>
                      {doc.analysis && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Legal Analysis</h5>
                          <div className="text-gray-600 bg-gray-50 rounded p-6">
                            <MarkdownRenderer content={doc.analysis} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No documents found. Upload a document to get started!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}