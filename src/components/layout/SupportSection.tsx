import React from 'react';
import { MessageSquare } from 'lucide-react';

interface SupportSectionProps {
  userType: 'creator' | 'brand';
}

const SupportSection: React.FC<SupportSectionProps> = ({ userType }) => {
  const email = userType === 'creator' ? 'creators@create-os.com' : 'brands@create-os.com';
  
  return (
    <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-400" />
        Support
      </h2>
      
      <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
        <p className="text-gray-300">
          For support, email us at <span className="text-blue-400">{email}</span>
        </p>
      </div>
    </div>
  );
};

export default SupportSection;