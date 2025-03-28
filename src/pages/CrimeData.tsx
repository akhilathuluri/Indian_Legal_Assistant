import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StateDataModal from '../components/StateDataModal';
import IndiaMap from '../components/IndiaMap';

interface CrimeData {
  "Sl. No.": number;
  "State/UT": string;
  "2016 - CR": number;
  "2016 - Rate": number;
  "2017 - CR": number;
  "2017 - Rate": number;
  "2018 - CR": number;
  "2018 - Rate": number;
  "2019 - CR": number;
  "2019 - Rate": number;
  "2020 - CR": number;
  "2020 - Rate": number;
}

export default function CrimeData() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<CrimeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCrimeData();
  }, [user, navigate]);

  const fetchCrimeData = async () => {
    try {
      console.log('Fetching crime data...'); // Debug log
      
      const { data, error } = await supabase
        .from('crime_data')
        .select('*');

      console.log('Supabase response:', { data, error }); // Debug log

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No data returned from Supabase');
        throw new Error('No crime data available');
      }

      console.log('Fetched crime data:', data); // Debug log
      setCrimeData(data);
    } catch (error: any) {
      console.error('Error fetching crime data:', error);
      toast.error(error.message || 'Failed to load crime data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateClick = (stateName: string) => {
    console.log('Clicked state:', stateName); // For debugging
    
    // Normalize the clicked state name
    const normalizedClickedState = stateName
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const stateData = crimeData.find(data => {
      // Normalize the database state name
      const dbStateName = data['State/UT']
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      // Add common variations of state names
      const stateVariations: { [key: string]: string[] } = {
        'delhi': ['nct of delhi', 'delhi'],
        'jammu and kashmir': ['jammu & kashmir', 'jammu and kashmir'],
        'andhra pradesh': ['andhra pradesh'],
        'madhya pradesh': ['madhya pradesh'],
        // Add more variations as needed
      };

      // Check if the clicked state has any known variations
      const variations = stateVariations[normalizedClickedState] || [normalizedClickedState];
      
      return variations.includes(dbStateName);
    });

    if (stateData) {
      setSelectedState(stateData);
      setIsModalOpen(true);
    } else {
      console.log('Database state names:', crimeData.map(d => d['State/UT'])); // For debugging
      toast.error(`No data available for ${stateName}`);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">India Crime Statistics</h1>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <p className="text-gray-600">Click on any state to view detailed crime statistics</p>
          <p className="text-sm text-gray-500 mt-2 sm:mt-0">
            Data provided by{' '}
            <a 
              href="https://www.data.gov.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 underline"
            >
              Open Government Data (OGD) Platform India
            </a>
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="relative w-full max-w-4xl mx-auto">
            <IndiaMap onStateClick={handleStateClick} />
          </div>
        )}

        {selectedState && (
          <StateDataModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            stateData={selectedState}
          />
        )}
      </div>
    </div>
  );
}
