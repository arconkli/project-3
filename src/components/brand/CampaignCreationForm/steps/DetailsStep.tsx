import React from 'react';
import { Globe } from 'lucide-react';
import type { CampaignFormData, FieldErrors } from '../types';

interface DetailsStepProps {
  formData: CampaignFormData;
  validationErrors: FieldErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPlatformChange: (platform: keyof CampaignFormData['platforms']) => void;
  onContentTypeChange: (type: 'original' | 'repurposed' | 'both') => void;
}

const DetailsStep: React.FC<DetailsStepProps> = ({
  formData,
  validationErrors,
  onChange,
  onPlatformChange,
  onContentTypeChange
}) => {
  // Log form data for debugging
  console.log("DetailsStep - formData:", {
    title: formData.title,
    platforms: formData.platforms,
    contentType: formData.contentType
  });

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
          Campaign Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={onChange}
          className={`w-full p-3 bg-transparent border rounded-lg focus:outline-none ${
            validationErrors['title']
              ? 'border-red-500'
              : 'border-gray-700 focus:border-red-500'
          }`}
          placeholder="e.g., Summer Movie Launch"
          required
        />
        {validationErrors['title'] && (
          <p className="mt-1 text-sm text-red-500">{validationErrors['title']}</p>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-blue-400" />
          <label className="block text-sm font-medium text-gray-300">
            Platforms <span className="text-red-500">*</span>
          </label>
        </div>

        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${
            validationErrors['platforms']
              ? 'border border-red-500 rounded-lg p-4'
              : ''
          }`}
        >
          {/* Platform selection buttons */}
          {[
            {
              id: 'tiktok',
              name: 'TikTok',
              icon: (
                <svg className="h-8 w-8 text-cyan-400 mb-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              ),
              color: 'cyan'
            },
            {
              id: 'instagram',
              name: 'Instagram',
              icon: (
                <svg className="h-8 w-8 text-pink-500 mb-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/>
                  <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              ),
              color: 'pink'
            },
            {
              id: 'youtube',
              name: 'YouTube',
              icon: (
                <svg className="h-8 w-8 text-red-500 mb-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              ),
              color: 'red'
            },
            {
              id: 'twitter',
              name: 'X/Twitter',
              icon: (
                <svg className="h-8 w-8 text-blue-400 mb-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              ),
              color: 'blue'
            }
          ].map(platform => (
            <div
              key={platform.id}
              className={`p-4 border rounded-lg flex flex-col items-center cursor-pointer transition-colors ${
                formData.platforms[platform.id as keyof typeof formData.platforms]
                  ? platform.color === 'cyan' 
                    ? 'border-cyan-500 bg-cyan-900/20'
                    : platform.color === 'pink'
                    ? 'border-pink-500 bg-pink-900/20'
                    : platform.color === 'red'
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
              onClick={() => onPlatformChange(platform.id as keyof typeof formData.platforms)}
            >
              {platform.icon}
              <span className="font-medium">{platform.name}</span>
            </div>
          ))}
        </div>
        {validationErrors['platforms'] && (
          <p className="mt-1 text-sm text-red-500">{validationErrors['platforms']}</p>
        )}
      </div>

      {/* Content Type Selection */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 text-purple-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <label className="block text-sm font-medium text-gray-300">
            Content Type <span className="text-red-500">*</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              type: 'original',
              title: 'Original Content',
              description: 'Creators will produce new content specifically for your campaign',
              color: 'green'
            },
            {
              type: 'repurposed',
              title: 'Repurposed Content',
              description: 'Creators will adapt existing content to fit your campaign',
              color: 'blue'
            },
            {
              type: 'both',
              title: 'Both Types',
              description: 'Creators can choose to create new or adapt existing content',
              color: 'purple'
            }
          ].map(option => (
            <div
              key={option.type}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.contentType === option.type
                  ? option.color === 'green'
                    ? 'border-green-500 bg-green-900/20'
                    : option.color === 'blue'
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-purple-500 bg-purple-900/20'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
              onClick={() => onContentTypeChange(option.type as typeof formData.contentType)}
            >
              <div className="flex items-center mb-2">
                <div className={`w-4 h-4 rounded-full mr-2 ${
                  formData.contentType === option.type
                    ? option.color === 'green'
                      ? 'bg-green-500'
                      : option.color === 'blue'
                      ? 'bg-blue-500'
                      : 'bg-purple-500'
                    : 'bg-gray-700'
                }`}></div>
                <h4 className="font-medium">{option.title}</h4>
              </div>
              <p className="text-sm text-gray-400 mb-3">{option.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailsStep;