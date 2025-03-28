import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Mic, StopCircle, Play, Loader2, History, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AudioTranscript } from '../lib/supabase';
import toast from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import MarkdownRenderer from '../components/MarkdownRenderer';

const languages = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'Telugu' },
  { value: 'hi', label: 'Hindi' }
];

export default function AudioTranscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [savedTranscripts, setSavedTranscripts] = useState<AudioTranscript[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  
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
    }
  }, [user, navigate]);

  const fetchTranscripts = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('audio_transcripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedTranscripts(data || []);
    } catch (error: any) {
      console.error('Error fetching transcripts:', error);
      toast.error('Failed to load transcript history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchTranscripts();
    }
  }, [showHistory, user]);

  const checkNameAvailability = async (name: string) => {
    if (!user || !name.trim()) {
      setIsNameValid(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('audio_transcripts')
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
    checkNameAvailability(recordingName);
  }, [recordingName]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    setTranscript('');
    setSummary('');
  };

  const startRecording = useCallback(() => {
    if (!recordingName.trim()) {
      toast.error('Please enter a name for the recording');
      return;
    }

    if (!isNameValid) {
      toast.error('This name is already taken. Please choose a different name.');
      return;
    }

    setTranscript('');
    setSummary('');

    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;

      // Set language based on selection
      switch (language) {
        case 'en':
          recognition.lang = 'en-IN';
          break;
        case 'te':
          recognition.lang = 'te-IN';
          break;
        case 'hi':
          recognition.lang = 'hi-IN';
          break;
        default:
          recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsTranscribing(true);
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

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Error in speech recognition');
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      toast.error('Speech recognition is not supported in this browser');
    }
    
    startMediaRecording();
  }, [language, startMediaRecording, recordingName, isNameValid]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopMediaRecording();
  }, [stopMediaRecording]);

  const processAudio = useCallback(async () => {
    if (!mediaBlobUrl || language !== 'en' || !transcript || !recordingName.trim()) return;

    setIsProcessing(true);
    try {
      const audioBlob = await fetch(mediaBlobUrl).then(r => r.blob());
      
      const file = new File([audioBlob], `${recordingName.trim()}.wav`, {
        type: 'audio/wav',
      });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(`${user!.id}/${file.name}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload audio file');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(`${user!.id}/${file.name}`);

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analyze this legal transcript in Markdown format:

# Legal Analysis Report

## Case Category
[Determine category]

## Applicable Sections
* List relevant sections

## Key Points
* Critical points for the case

## Summary
Detailed analysis

Transcript: ${transcript}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const legalSummary = response.text();
      setSummary(legalSummary);

      const { error: dbError } = await supabase
        .from('audio_transcripts')
        .insert({
          user_id: user!.id,
          name: recordingName.trim(),
          audio_url: publicUrl,
          transcript,
          language,
          summary: legalSummary
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save transcript data');
      }

      if (showHistory) {
        fetchTranscripts();
      }

      toast.success('Audio processed successfully!');
      setRecordingName(''); // Reset the name field after successful processing
    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast.error(error.message || 'Error processing audio');
    } finally {
      setIsProcessing(false);
    }
  }, [mediaBlobUrl, language, transcript, user, showHistory, recordingName]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audio Transcription</h1>
        <p className="text-gray-600 mb-6">Record and transcribe legal proceedings</p>
        
        <div className="mb-6">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
            Select Language
          </label>
          <select
            id="language"
            value={language}
            onChange={handleLanguageChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="recordingName" className="block text-sm font-medium text-gray-700 mb-2">
            Recording Name
          </label>
          <input
            type="text"
            id="recordingName"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            placeholder="Enter a unique name for this recording"
            className={`block w-full rounded-md shadow-sm sm:text-sm p-2 border ${
              recordingName && !isNameValid
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
          {recordingName && !isNameValid && (
            <p className="mt-1 text-sm text-red-600">
              This name is already taken. Please choose a different name.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
          {status !== 'recording' ? (
            <button
              onClick={startRecording}
              disabled={!recordingName.trim() || !isNameValid}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <StopCircle className="h-5 w-5 mr-2" />
              Stop Recording
            </button>
          )}
          
          {mediaBlobUrl && transcript && (
            <button
              onClick={processAudio}
              disabled={isProcessing || language !== 'en' || !recordingName.trim() || !isNameValid}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              Process Recording
            </button>
          )}
        </div>

        {mediaBlobUrl && (
          <div className="mb-6 space-y-2">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recording Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <audio src={mediaBlobUrl} controls className="w-full max-w-lg mx-auto" />
            </div>
          </div>
        )}

        {(transcript || isTranscribing) && (
          <div className="mb-6 space-y-2">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Transcript {isTranscribing && <span className="text-sm text-gray-500">(Recording...)</span>}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[60vh]">
              <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
            </div>
          </div>
        )}

        {summary && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Legal Analysis</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <MarkdownRenderer content={summary} />
            </div>
          </div>
        )}

        <div className="border-t pt-6">
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
            <div className="mt-4 grid grid-cols-1 gap-4">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : savedTranscripts.length > 0 ? (
                <div className="space-y-4">
                  {savedTranscripts.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {item.language.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Created on {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Recording</h5>
                        <audio src={item.audio_url} controls className="w-full max-w-lg mx-auto" />
                      </div>
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Transcript</h5>
                        <p className="text-gray-600 bg-gray-50 rounded p-3">{item.transcript}</p>
                      </div>
                      {item.summary && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Legal Analysis</h5>
                          <div className="bg-gray-50 rounded p-6">
                            <MarkdownRenderer content={item.summary} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No transcripts found. Start recording to create your first transcript!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}