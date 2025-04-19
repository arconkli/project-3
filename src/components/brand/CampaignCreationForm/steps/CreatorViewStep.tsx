import React from 'react';
import { CalendarIcon, FileText, Eye } from 'lucide-react';
import type { CampaignFormData } from '../types';
import { formatDate } from '../utils';

interface CreatorViewStepProps {
  formData: CampaignFormData;
}

const CreatorViewStep: React.FC<CreatorViewStepProps> = ({ formData }) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg bg-black/40 border border-gray-800">
        <h3 className="text-xl font-bold mb-6">Creator View Preview</h3>

        <div className="p-5 border border-gray-700 rounded-lg bg-black/60 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-xl font-bold text-white">
                {formData.title || 'Your Campaign Title'}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-red-900/20 text-red-400 text-sm">
                  NEW
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-400 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {formData.endDate
                ? formatDate(formData.endDate)
                : 'Campaign End Date'}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-400 mb-1">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(formData.platforms)
                  .filter(([_, active]) => active)
                  .map(([platform]) => (
                    <span
                      key={platform}
                      className="px-3 py-1 bg-black/40 border border-gray-700 rounded-lg text-sm text-gray-300"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Content Section */}
              {(formData.contentType === 'original' ||
                formData.contentType === 'both') && (
                <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                  <h5 className="font-medium text-green-400 mb-3">
                    Original Content
                  </h5>

                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">Campaign Brief</p>
                    <p className="bg-black/40 p-3 rounded-lg border border-gray-800 text-sm">
                      {formData.brief.original ||
                        'Your campaign brief will appear here'}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">
                      Content Guidelines
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {formData.guidelines.original
                        .filter((guideline) => guideline.trim().length > 0)
                        .map((guideline, index) => (
                          <li key={index}>{guideline}</li>
                        ))}
                      {formData.guidelines.original.filter(
                        (g) => g.trim().length > 0
                      ).length === 0 && (
                        <li className="text-gray-500 italic">
                          Your guidelines will appear here
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Required Hashtag
                    </p>
                    <p className="font-bold text-blue-400">
                      {formData.hashtags.original || '#YourBrandAd'}
                    </p>
                  </div>
                </div>
              )}

              {/* Repurposed Content Section */}
              {(formData.contentType === 'repurposed' ||
                formData.contentType === 'both') && (
                <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                  <h5 className="font-medium text-blue-400 mb-3">
                    Repurposed Content
                  </h5>

                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">Campaign Brief</p>
                    <p className="bg-black/40 p-3 rounded-lg border border-gray-800 text-sm">
                      {formData.brief.repurposed ||
                        'Your campaign brief will appear here'}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">
                      Content Guidelines
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {formData.guidelines.repurposed
                        .filter((guideline) => guideline.trim().length > 0)
                        .map((guideline, index) => (
                          <li key={index}>{guideline}</li>
                        ))}
                      {formData.guidelines.repurposed.filter(
                        (g) => g.trim().length > 0
                      ).length === 0 && (
                        <li className="text-gray-500 italic">
                          Your guidelines will appear here
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Required Hashtag
                    </p>
                    <p className="font-bold text-blue-400">
                      {formData.hashtags.repurposed || '#YourBrandAd'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Payout Rate</p>
                <div className="flex justify-between">
                  <span>Original Content:</span>
                  <span className="text-green-400 font-medium">
                    ${formData.payoutRate.original || '500'} <span className="text-gray-300">per 1M views</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Repurposed Content:</span>
                  <span className="text-green-400 font-medium">
                    ${formData.payoutRate.repurposed || '250'} <span className="text-gray-300">per 1M views</span>
                  </span>
                </div>
              </div>

              {formData.assets.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Campaign Assets</p>
                  <div className="bg-black/40 p-3 rounded-lg border border-gray-800 flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <span>
                      {formData.assets.length} file
                      {formData.assets.length !== 1 ? 's' : ''} available
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-900/10 border border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              This is how your campaign will appear to creators on their
              dashboard. They will be able to join the campaign and submit
              content that follows your guidelines. Payout rates will be updated in the next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorViewStep;