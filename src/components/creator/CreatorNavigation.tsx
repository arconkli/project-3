import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Home, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';

const CreatorNavigation: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <div className="sticky top-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 
              className="text-2xl font-bold cursor-pointer text-white"
              onClick={() => navigate('/')}
            >
              CREATE_OS
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              className="px-3 py-2 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              onClick={() => navigate('/')}
            >
              <Home className="h-5 w-5" />
              <span className="hidden md:inline">Home</span>
            </button>
            
            {user && (
              <>
                <button
                  className="px-3 py-2 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                  onClick={() => navigate('/dashboard')}
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline">Profile</span>
                </button>
                
                <button
                  className="px-3 py-2 rounded-lg text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorNavigation; 