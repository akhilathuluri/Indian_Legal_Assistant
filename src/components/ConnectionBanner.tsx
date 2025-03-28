import React, { useEffect, useState } from 'react';
import { Shield, Wifi, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ConnectionBanner() {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch IP address
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setIpAddress(data.ip))
      .catch(error => console.error('Error fetching IP:', error));

    // Check database connection with delay
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('audio_transcripts').select('count').limit(1);
        // Artificial delay for animation
        await new Promise(resolve => setTimeout(resolve, 5000));
        setIsConnected(!error);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-gray-100 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 duration-600">Your IP: {ipAddress || 'Loading...'}</span>
          </div>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 text-indigo-500 animate-spin" />
                <span className="text-indigo-600">Checking connection...</span>
              </>
            ) : (
              <>
                <Shield className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`${isConnected ? 'text-green-600' : 'text-red-600'} transition-colors duration-300`}>
                  {isConnected ? 'Securely connected to database' : 'Database connection error'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
