import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, LogOut, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Calculate storage usage
    const calculateStorageUsage = async () => {
      try {
        // Get all files from both buckets
        const [documentsResponse, recordingsResponse] = await Promise.all([
          supabase.storage.from('documents').list(user.id),
          supabase.storage.from('recordings').list(user.id)
        ]);

        let totalSize = 0;

        // Sum up sizes from both buckets
        if (documentsResponse.data) {
          totalSize += documentsResponse.data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
        }
        if (recordingsResponse.data) {
          totalSize += recordingsResponse.data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
        }

        // Convert to MB
        setStorageUsed(totalSize / (1024 * 1024));
      } catch (error) {
        console.error('Error calculating storage usage:', error);
        toast.error('Failed to calculate storage usage');
      } finally {
        setIsLoadingStorage(false);
      }
    };

    calculateStorageUsage();
  }, [user, navigate]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Error updating password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* User Info */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600">
              <span className="font-medium">Email:</span> {user.email}
            </p>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Storage Usage</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {isLoadingStorage ? (
              <div className="animate-pulse flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-2">
                  <HardDrive className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium">{storageUsed.toFixed(2)} MB</span>
                  <span className="text-gray-500 ml-2">of 1 GB used</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min((storageUsed / 1024) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Lock className="h-4 w-4 mr-2" />
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Sign Out */}
        <div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}