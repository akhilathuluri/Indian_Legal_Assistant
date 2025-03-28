import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GitGraph, Loader2, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateFlowchartPrompt, getFallbackFlowchart } from '../utils/flowchartTemplates';

type FlowStep = {
  id: string;
  title: string;
  description: string;
  options?: {
    text: string;
    nextStep: string;
  }[];
  isEndPoint?: boolean;
};

type FlowchartType = {
  id: string;
  title: string;
  description: string;
  steps: FlowStep[];
};

const PREDEFINED_FLOWCHARTS = [
  {
    id: 'domestic-violence',
    title: 'Domestic Violence Case Filing',
    description: 'Process for filing a case under the Protection of Women from Domestic Violence Act'
  },
  {
    id: 'fir-filing',
    title: 'FIR Filing Process',
    description: 'Step-by-step guide to file a First Information Report (FIR)'
  },
  {
    id: 'divorce',
    title: 'Divorce Procedure',
    description: 'Legal process for filing and obtaining a divorce'
  },
  {
    id: 'property-dispute',
    title: 'Property Dispute Resolution',
    description: 'Steps to resolve property disputes through legal channels'
  }
];

type CustomFlowInput = {
  title: string;
  description: string;
};

export default function LegalFlowcharts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [flowchart, setFlowchart] = useState<FlowchartType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customInput, setCustomInput] = useState<CustomFlowInput>({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const generateFlowchart = async (flowType: string) => {
    setIsLoading(true);
    let retryCount = 0;
    const maxRetries = 2;

    const tryGenerateFlowchart = async (): Promise<FlowchartType> => {
      try {
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: generateFlowchartPrompt(flowType) }]}],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 4096,
          },
        });

        const response = await result.response;
        let text = response.text()
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();

        // Remove any leading/trailing brackets if they're incomplete
        text = text.replace(/^\s*{\s*\n/, '{').replace(/\n\s*}\s*$/, '}');
        
        const flowchartData = JSON.parse(text);
        
        if (!flowchartData.steps?.length) {
          throw new Error('Invalid flowchart structure');
        }

        return {
          ...flowchartData,
          steps: flowchartData.steps.map((step: FlowStep, index: number) => ({
            ...step,
            id: step.id || `step-${index + 1}`,
            options: step.options || [],
            isEndPoint: step.isEndPoint || false
          }))
        };

      } catch (error) {
        console.error('Generation attempt failed:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          return tryGenerateFlowchart();
        }
        // If all retries fail, use fallback
        return getFallbackFlowchart(flowType);
      }
    };

    try {
      const flowchartData = await tryGenerateFlowchart();
      setFlowchart(flowchartData);
      setCurrentStep(flowchartData.steps[0].id);
      setStepHistory([flowchartData.steps[0].id]);
    } catch (error) {
      console.error('Final error generating flowchart:', error);
      toast.error('Using basic flowchart template due to generation issues');
      const fallback = getFallbackFlowchart(flowType);
      setFlowchart(fallback);
      setCurrentStep(fallback.steps[0].id);
      setStepHistory([fallback.steps[0].id]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlowSelect = (flowId: string) => {
    setSelectedFlow(flowId);
    generateFlowchart(PREDEFINED_FLOWCHARTS.find(f => f.id === flowId)?.title || '');
  };

  const getCurrentStep = () => {
    if (!flowchart) return null;
    return flowchart.steps.find(step => step.id === currentStep);
  };

  const handleOptionSelect = (nextStep: string) => {
    setStepHistory(prev => [...prev, nextStep]);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (stepHistory.length > 1) {
      const newHistory = [...stepHistory];
      newHistory.pop();
      setStepHistory(newHistory);
      setCurrentStep(newHistory[newHistory.length - 1]);
    }
  };

  const handleReset = () => {
    if (flowchart?.steps[0]) {
      setCurrentStep(flowchart.steps[0].id);
      setStepHistory([flowchart.steps[0].id]);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateFlowchart(customInput.title);
    setShowCustomForm(false);
    setSelectedFlow('custom');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <GitGraph className="h-8 w-8 text-indigo-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Legal Flowcharts</h1>
            <p className="text-gray-600 mt-1">Interactive guides for legal procedures</p>
          </div>
        </div>

        {!selectedFlow ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PREDEFINED_FLOWCHARTS.map((flow) => (
                <button
                  key={flow.id}
                  onClick={() => handleFlowSelect(flow.id)}
                  className="p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{flow.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{flow.description}</p>
                </button>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowCustomForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Create Custom Flowchart
              </button>
            </div>

            {showCustomForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Create Custom Flowchart</h3>
                  <form onSubmit={handleCustomSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Legal Procedure Title
                        </label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={customInput.title}
                          onChange={(e) => setCustomInput(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Brief Description
                        </label>
                        <textarea
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          rows={3}
                          value={customInput.description}
                          onChange={(e) => setCustomInput(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowCustomForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                        >
                          Generate Flowchart
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-gray-600 mt-4">Generating flowchart...</p>
              </div>
            ) : flowchart && getCurrentStep() ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setSelectedFlow('')}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    ← Back to Flowcharts
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBack}
                      disabled={stepHistory.length <= 1}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50 flex items-center"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </button>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {getCurrentStep()?.title}
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {getCurrentStep()?.description}
                  </p>
                </div>

                {getCurrentStep()?.isEndPoint ? (
                  <div className="text-center py-6">
                    <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900">End of Process</p>
                    <button
                      onClick={handleReset}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Start Over
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getCurrentStep()?.options?.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option.nextStep)}
                        className="w-full text-left p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all flex justify-between items-center group"
                      >
                        <span className="text-gray-900">{option.text}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Something went wrong. Please try again.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
