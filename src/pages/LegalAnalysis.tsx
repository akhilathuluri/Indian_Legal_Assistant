import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Mic, FileText, Loader2, Check, X, Upload, History, ChevronDown, ChevronUp, StopCircle } from 'lucide-react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { useDropzone } from 'react-dropzone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist/webpack';
import MarkdownRenderer from '../components/MarkdownRenderer';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

// Types
interface AudioTranscript {
  id: string;
  user_id: string;
  name: string;
  audio_url: string;
  transcript: string;
  language: string;
  summary: string;
  created_at: string;
}

interface Document {
  id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_type: string;
  extracted_text: string;
  analysis: string;
  created_at: string;
}

interface SimilarCase {
  title: string;
  link: string;
}

interface AnalysisResult {
  category: string;
  sections: string[];
  requirements: string[];
  winningPoints: string[];
  similarCases: SimilarCase[];
  summary: string;
}

// Update the ANALYSIS_PROMPT_TEMPLATE to be more explicit about Markdown
const ANALYSIS_PROMPT_TEMPLATE = `Analyze this case information and provide a comprehensive analysis in Markdown format:

Please format your response exactly as follows:

# Legal Analysis Report

## Case Category
[Category explanation]

## Applicable Legal Sections
* Section 1 with description
* Section 2 with description

## Requirements
* Required Document 1
* Required Document 2
* Required Evidence 1
* Required Evidence 2
* Court Requirement 1
* Court Requirement 2

## Key Points for Success
* Point 1: [explanation]
* Point 2: [explanation]
* Point 3: [explanation]

## Similar Cases
* Case Name 1: [Brief description]
* Case Name 2: [Brief description]

## Summary
[Detailed analysis paragraphs]

Case Information for Analysis:
{input}`;

// Update the convertAnalysisToMarkdown function
const convertAnalysisToMarkdown = (analysis: AnalysisResult): string => {
  return `# Legal Analysis Report

## Case Category
${analysis.category}

## Applicable Legal Sections
${analysis.sections.map(s => `* ${s}`).join('\n')}

## Requirements
${analysis.requirements.map(r => `* ${r}`).join('\n')}

## Key Points for Success
${analysis.winningPoints.map(p => `* ${p}`).join('\n')}

## Similar Cases
${analysis.similarCases.map(c => `* ${c.title}${c.link ? ` ([Link](${c.link}))` : ''}: Brief overview`).join('\n')}

## Summary
${analysis.summary}`;
};

export default function LegalAnalysis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseName, setCaseName] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [audioTranscripts, setAudioTranscripts] = useState<AudioTranscript[]>([]);
  const [selectedAudioTranscript, setSelectedAudioTranscript] = useState<AudioTranscript | null>(null);
  const [isLoadingAudioTranscripts, setIsLoadingAudioTranscripts] = useState(false);
  
  // Document states
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  
  // Evidence states
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);
  const [evidenceDescriptions, setEvidenceDescriptions] = useState<string[]>([]);
  
  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // History states
  const [showHistory, setShowHistory] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Media recorder
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const {
    status,
    startRecording: startMediaRecording,
    stopRecording: stopMediaRecording,
    mediaBlobUrl
  } = useReactMediaRecorder({ 
    audio: true,
    blobPropertyBag: { type: 'audio/wav' }
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchAudioTranscripts();
      fetchDocuments();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (showHistory) {
      fetchSavedAnalyses();
    }
  }, [showHistory]);

  const checkNameAvailability = async (name: string) => {
    if (!user || !name.trim()) {
      setIsNameValid(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('case_analysis')
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
    checkNameAvailability(caseName);
  }, [caseName]);

  const fetchAudioTranscripts = async () => {
    if (!user) return;
    
    setIsLoadingAudioTranscripts(true);
    try {
      const { data, error } = await supabase
        .from('audio_transcripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudioTranscripts(data || []);
    } catch (error: any) {
      console.error('Error fetching audio transcripts:', error);
      toast.error('Failed to load audio transcripts');
    } finally {
      setIsLoadingAudioTranscripts(false);
    }
  };

  const fetchDocuments = async () => {
    if (!user) return;
    
    setIsLoadingDocuments(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const fetchSavedAnalyses = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('case_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedAnalyses(data || []);
    } catch (error: any) {
      console.error('Error fetching saved analyses:', error);
      toast.error('Failed to load analysis history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Audio recording functions
  const startRecording = useCallback(() => {
    setAudioTranscript('');
    
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setAudioTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Error in speech recognition');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      toast.error('Speech recognition is not supported in this browser');
    }
    
    startMediaRecording();
  }, [startMediaRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopMediaRecording();
    setIsRecording(false);
  }, [stopMediaRecording]);

  // Document handling functions
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

  const onDocumentDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      toast.error('Please upload a PDF or text file');
      return;
    }

    setSelectedFile(file);
    
    try {
      let text = '';
      if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        text = await extractTextFromPDF(file);
      }
      
      if (!text.trim()) {
        throw new Error('No text could be extracted from the document');
      }
      
      setExtractedText(text);
    } catch (error: any) {
      toast.error(error.message || 'Error extracting text from document');
    }
  }, []);

  const { getRootProps: getDocumentRootProps, getInputProps: getDocumentInputProps } = useDropzone({
    onDrop: onDocumentDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  // Evidence handling functions
  const onEvidenceDrop = useCallback((acceptedFiles: File[]) => {
    setEvidenceImages(prev => [...prev, ...acceptedFiles]);
    setEvidenceDescriptions(prev => [...prev, ...acceptedFiles.map(() => '')]);
  }, []);

  const { getRootProps: getEvidenceRootProps, getInputProps: getEvidenceInputProps } = useDropzone({
    onDrop: onEvidenceDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    }
  });

  const removeEvidence = (index: number) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
    setEvidenceDescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateEvidenceDescription = (index: number, description: string) => {
    const newDescriptions = [...evidenceDescriptions];
    newDescriptions[index] = description;
    setEvidenceDescriptions(newDescriptions);
  };

  // Improved analysis function
  const analyzeCase = async () => {
    if (!user || !caseName.trim() || !isNameValid) {
      toast.error('Please provide a valid case name');
      return;
    }

    if (!selectedAudioTranscript?.transcript && !audioTranscript && 
        !selectedDocument?.extracted_text && !extractedText) {
      toast.error('Please provide at least one source of information (audio or document)');
      return;
    }

    setIsProcessing(true);
    try {
      // Prepare input text more systematically
      const inputSections = [];
      
      if (selectedAudioTranscript?.transcript || audioTranscript) {
        inputSections.push(`VERBAL TESTIMONY:\n${selectedAudioTranscript?.transcript || audioTranscript}`);
      }
      
      if (selectedDocument?.extracted_text || extractedText) {
        inputSections.push(`DOCUMENT CONTENT:\n${selectedDocument?.extracted_text || extractedText}`);
      }
      
      if (evidenceDescriptions.some(desc => desc.trim())) {
        const evidenceSection = evidenceDescriptions
          .map((desc, i) => desc.trim() ? `Evidence ${i + 1}: ${desc}` : null)
          .filter(Boolean)
          .join('\n');
        inputSections.push(`PHYSICAL EVIDENCE:\n${evidenceSection}`);
      }

      const prompt = ANALYSIS_PROMPT_TEMPLATE.replace(
        '{input}',
        inputSections.join('\n\n')
      );

      // Use Gemini API for analysis
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Parse the markdown response into sections
      const sections = analysisText.split(/(?=## )/);
      const analysisData: AnalysisResult = {
        category: '',
        sections: [],
        requirements: [],
        winningPoints: [],
        similarCases: [],
        summary: ''
      };

      sections.forEach(section => {
        const lines = section.split('\n').filter(Boolean);
        const title = lines[0].replace('#', '').trim();
        const content = lines.slice(1).join('\n').trim();

        if (title.toLowerCase().includes('category')) {
          analysisData.category = content;
        } else if (title.toLowerCase().includes('sections')) {
          analysisData.sections = content.split('*').filter(Boolean).map(s => s.trim());
        } else if (title.toLowerCase().includes('requirements')) {
          analysisData.requirements = content.split('*').filter(Boolean).map(r => r.trim());
        } else if (title.toLowerCase().includes('key points')) {
          analysisData.winningPoints = content.split('*').filter(Boolean).map(p => p.trim());
        } else if (title.toLowerCase().includes('similar cases')) {
          analysisData.similarCases = content
            .split('*')
            .filter(Boolean)
            .map(c => {
              const [title, description] = c.split(':').map(s => s.trim());
              const linkMatch = title.match(/\[(.*?)\]\((.*?)\)/);
              return {
                title: linkMatch ? linkMatch[1] : title,
                link: linkMatch ? linkMatch[2] : ''
              };
            });
        } else if (title.toLowerCase().includes('summary')) {
          analysisData.summary = content;
        }
      });

      setAnalysisResult(analysisData);

      // Save to database
      const { error: dbError } = await supabase
        .from('case_analysis')
        .insert({
          user_id: user.id,
          name: caseName.trim(),
          analysis: analysisData,
          audio_transcript_id: selectedAudioTranscript?.id,
          document_id: selectedDocument?.id,
        });

      if (dbError) throw dbError;

      toast.success('Case analysis completed successfully!');
      
      if (showHistory) {
        fetchSavedAnalyses();
      }
    } catch (error: any) {
      console.error('Error analyzing case:', error);
      toast.error(error.message || 'Error analyzing case');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Case Analysis</h1>
        <p className="text-gray-600 mb-6">Analyze legal cases using multiple sources of information</p>
        
        {/* Case Name */}
        <div className="mb-6">
          <label htmlFor="caseName" className="block text-sm font-medium text-gray-700 mb-2">
            Case Name
          </label>
          <input
            type="text"
            id="caseName"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            placeholder="Enter a unique name for this case"
            className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${
              caseName && !isNameValid
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
          {caseName && !isNameValid && (
            <p className="mt-1 text-sm text-red-600">
              This name is already taken. Please choose a different name.
            </p>
          )}
        </div>
        
        {/* Audio Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Audio Information</h2>
          
          {/* Select existing audio */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Existing Audio Transcript
            </label>
            {isLoadingAudioTranscripts ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : audioTranscripts.length > 0 ? (
              <select
                value={selectedAudioTranscript?.id || ''}
                onChange={(e) => {
                  const selected = audioTranscripts.find(t => t.id === e.target.value);
                  setSelectedAudioTranscript(selected || null);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              >
                <option value="">-- Select an audio transcript --</option>
                {audioTranscripts.map((transcript) => (
                  <option key={transcript.id} value={transcript.id}>
                    {transcript.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500">No audio transcripts available</p>
            )}
          </div>
          
          {/* OR divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>
          
          {/* Record new audio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record New Audio
            </label>
            <div className="flex justify-center space-x-4 mb-4">
              {status !== 'recording' ? (
                <button
                  onClick={startRecording}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <StopCircle className="h-5 w-5 mr-2" />
                  Stop Recording
                </button>
              )}
            </div>
            
            {mediaBlobUrl && (
              <div className="mb-4">
                <audio src={mediaBlobUrl} controls className="w-full" />
              </div>
            )}
            
            {(audioTranscript || isRecording) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Transcript {isRecording && <span className="text-xs text-gray-500">(Recording...)</span>}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{audioTranscript}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Document Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Document Information</h2>
          
          {/* Select existing document */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Existing Document
            </label>
            {isLoadingDocuments ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : documents.length > 0 ? (
              <select
                value={selectedDocument?.id || ''}
                onChange={(e) => {
                  const selected = documents.find(d => d.id === e.target.value);
                  setSelectedDocument(selected || null);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              >
                <option value="">-- Select a document --</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500">No documents available</p>
            )}
          </div>
          
          {/* OR divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>
          
          {/* Upload new document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New Document
            </label>
            <div 
              {...getDocumentRootProps()} 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-indigo-400"
            >
              <input {...getDocumentInputProps()} />
              <FileText className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop a PDF or text file here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, TXT
              </p>
            </div>
            
            {selectedFile && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Selected file: {selectedFile.name}
                </p>
              </div>
            )}
            
            {extractedText && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Extracted Text</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{extractedText}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Evidence Section (Optional) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Evidence (Optional)</h2>
          <div 
            {...getEvidenceRootProps()} 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-indigo-400"
          >
            <input {...getEvidenceInputProps()} />
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop image files here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPG, PNG
            </p>
          </div>
          
          {evidenceImages.length > 0 && (
            <div className="mt-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Uploaded Evidence</h3>
              {evidenceImages.map((file, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <button 
                        onClick={() => removeEvidence(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={evidenceDescriptions[index]}
                      onChange={(e) => updateEvidenceDescription(index, e.target.value)}
                      placeholder="Describe this evidence..."
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Analyze Button */}
        <div className="flex justify-center">
          <button
            onClick={analyzeCase}
            disabled={isProcessing || !caseName.trim() || !isNameValid || 
              ((!selectedAudioTranscript && !audioTranscript) && 
               (!selectedDocument && !extractedText))}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Analyze Case
              </>
            )}
          </button>
        </div>
        
        {/* Analysis Result */}
        {analysisResult && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Result</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <MarkdownRenderer content={convertAnalysisToMarkdown(analysisResult)} />
            </div>
          </div>
        )}
        
        {/* History Section */}
        <div className="border-t mt-8 pt-6">
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
            <div className="mt-4">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : savedAnalyses.length > 0 ? (
                <div className="space-y-4">
                  {savedAnalyses.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Category:</span>
                          <span className="ml-2 text-sm text-gray-600">{item.analysis.category}</span>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Sections:</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {item.analysis.sections.join(', ')}
                          </span>
                        </div>
                        
                        <div className="mt-2">
                          <button
                            onClick={() => {
                              setAnalysisResult(item.analysis);
                              window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                              });
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            View Full Analysis
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No saved analyses found. Analyze a case to get started!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
