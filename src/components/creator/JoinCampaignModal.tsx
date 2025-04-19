import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AvailableCampaign } from './types';

interface JoinCampaignModalProps {
  campaign: AvailableCampaign;
  onClose: () => void;
  onJoin: (selectedPlatforms: string[]) => void;
}

const JoinCampaignModal: React.FC<JoinCampaignModalProps> = ({ campaign, onClose, onJoin }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const handleJoin = () => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }
    onJoin(selectedPlatforms);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-6"
      onClick={onClose}
    >
      <div
        className="bg-black/40 border border-gray-800 rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Join Campaign</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">{campaign.title}</h3>
          <p className="text-gray-400 mb-4">Select the platforms you want to create content for:</p>

          <div className="space-y-3">
            {campaign.requirements.platforms.map((platform) => (
              <label
                key={platform}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlatforms([...selectedPlatforms, platform]);
                    } else {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                    }
                    setError('');
                  }}
                  className="form-checkbox h-5 w-5 text-red-500 rounded border-gray-600 bg-gray-800 focus:ring-red-500"
                />
                <span className="text-white">{platform}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="text-red-500 mt-2 text-sm">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Join Campaign
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinCampaignModal; 