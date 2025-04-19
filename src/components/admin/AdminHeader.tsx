import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  onLogout: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-black/90 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded-full">
                ADMIN
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;