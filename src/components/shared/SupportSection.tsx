import React from 'react';
import { Mail } from 'lucide-react';

interface SupportSectionProps {
  userType: 'creator' | 'brand';
}

const SupportSection: React.FC<SupportSectionProps> = ({ userType }) => {
  const getSupportInfo = () => {
    switch (userType) {
      case 'creator':
        return {
          email: 'creators@create-os.com',
          title: 'Creator Support'
        };
      case 'brand':
        return {
          email: 'brands@create-os.com',
          title: 'Brand Support'
        };
      default:
        return {
          email: 'support@create-os.com',
          title: 'Support'
        };
    }
  };

  const { email, title } = getSupportInfo();

  return (
    <div className="w-full" style={{ backgroundColor: '#000000' }}>
      <div 
        className="border border-gray-800 rounded-lg p-6" 
        style={{ backgroundColor: '#000000' }}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Mail className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <a 
              href={`mailto:${email}`}
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              {email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportSection; 