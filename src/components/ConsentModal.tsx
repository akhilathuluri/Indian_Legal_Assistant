import React from 'react';
import { X } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentModal({ isOpen, onAccept, onDecline }: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Terms of Use & Privacy Policy</h2>
          <button onClick={onDecline} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="prose prose-sm max-w-none">
            <h3>Welcome to Our Legal Assistant Platform</h3>
            
            <p className="text-gray-600">
              Before you proceed, please read and accept our terms of use and privacy policy.
            </p>

            <h4>Data Collection and Usage</h4>
            <p className="text-gray-600">
              We collect and process your data to provide our legal services. This includes:
              - Document analysis and storage
              - Audio transcriptions
              - Usage analytics
              - Chat history and interactions
            </p>

            <h4>User Responsibilities</h4>
            <p className="text-gray-600">
              By using this platform, you agree to:
              - Provide accurate information
              - Maintain confidentiality of your account
              - Use the service in compliance with applicable laws
              - Not misuse or attempt to manipulate the system
            </p>

            <h4>Privacy and Security</h4>
            <p className="text-gray-600">
              We implement security measures to protect your data. However, no system is completely secure.
              By using our service, you acknowledge and accept the inherent risks of online services.
            </p>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Accept and Continue
          </button>
        </div>
      </div>
    </div>
  );
}
