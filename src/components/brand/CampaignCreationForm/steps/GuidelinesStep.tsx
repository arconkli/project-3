import React from 'react';
import { Calendar, Plus, Trash, Upload, FileText, Image, MessageSquare, Hash, AlertCircle } from 'lucide-react';
import type { CampaignFormData, FieldErrors } from '../types';
import { formatDate } from '../utils';

interface GuidelinesStepProps {
  formData: CampaignFormData;
  validationErrors: FieldErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDateSelect: (type: 'start' | 'end', date: string) => void;
  onAddGuideline: (type: 'original' | 'repurposed') => void;
  onRemoveGuideline: (type: 'original' | 'repurposed', index: number) => void;
  onGuidelineChange: (type: 'original' | 'repurposed', index: number, value: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  startDate: string;
  endDate: string;
}

const GuidelinesStep: React.FC<GuidelinesStepProps> = ({
  formData,
  validationErrors,
  onChange,
  onDateSelect,
  onAddGuideline,
  onRemoveGuideline,
  onGuidelineChange,
  onFileUpload,
  onRemoveFile,
  startDate,
  endDate
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Campaign Dates</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={onChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full p-3 bg-transparent border rounded-lg ${
                validationErrors['startDate']
                  ? 'border-red-500'
                  : 'border-gray-700 focus:border-red-500'
              }`}
              required
            />
            {validationErrors['startDate'] && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors['startDate']}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must be today or later
            </p>
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              id="endDate"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={onChange}
              min={formData.startDate}
              className={`w-full p-3 bg-transparent border rounded-lg ${
                validationErrors['endDate']
                  ? 'border-red-500'
                  : 'border-gray-700 focus:border-red-500'
              }`}
              required
            />
            {validationErrors['endDate'] && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors['endDate']}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Campaigns run for a minimum of 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Original Content Section */}
      {(formData.contentType === 'original' || formData.contentType === 'both') && (
        <div className="p-6 border border-green-800 bg-green-900/10 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-green-400">Original Content</h3>

          {/* Campaign Brief */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Campaign Brief <span className="text-red-500">*</span>
            </label>
            <textarea
              name="brief.original"
              value={formData.brief.original}
              onChange={onChange}
              className={`w-full p-3 bg-transparent border rounded-lg focus:outline-none min-h-32 ${
                validationErrors['brief.original']
                  ? 'border-red-500'
                  : 'border-gray-700 focus:border-red-500'
              }`}
              placeholder="Describe what you want creators to make for your campaign..."
              required
              rows={4}
            />
            {validationErrors['brief.original'] && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors['brief.original']}
              </p>
            )}
          </div>

          {/* Campaign Guidelines */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <label className="block text-sm font-medium text-gray-300">
                  Content Guidelines <span className="text-red-500">*</span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => onAddGuideline('original')}
                className="text-sm flex items-center text-green-400 hover:text-green-300"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Guideline
              </button>
            </div>

            <div className="p-3 bg-black/60 border border-gray-800 rounded-lg mb-4">
              <p className="text-sm text-gray-400">
                Provide clear instructions for creators to follow when making original content
              </p>
            </div>

            <div
              className={`space-y-3 ${
                validationErrors['guidelines.original']
                  ? 'border border-red-500 rounded-lg p-4'
                  : ''
              }`}
            >
              {formData.guidelines.original.map((guideline, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guideline}
                    onChange={(e) =>
                      onGuidelineChange('original', index, e.target.value)
                    }
                    className="flex-1 p-3 bg-transparent border border-gray-700 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="e.g., Show excitement for our upcoming movie premiere"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => onRemoveGuideline('original', index)}
                      className="p-2 text-gray-400 hover:text-red-400"
                      aria-label="Remove guideline"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {validationErrors['guidelines.original'] && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors['guidelines.original']}
              </p>
            )}
          </div>

          {/* Campaign Hashtag */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-5 w-5 text-purple-400" />
              <label className="block text-sm font-medium text-gray-300">
                Campaign Hashtag <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="p-3 bg-black/60 border border-gray-800 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">
                    <span className="text-yellow-400 font-medium">
                      Include ONE hashtag with #ad
                    </span>{' '}
                    in it (e.g. #MusicAd). This is required for disclosure compliance.
                  </p>
                </div>
              </div>
            </div>

            <input
              type="text"
              name="hashtags.original"
              value={formData.hashtags.original}
              onChange={onChange}
              className={`w-full p-3 bg-transparent border rounded-lg focus:outline-none ${
                validationErrors['hashtags.original']
                  ? 'border-red-500'
                  : 'border-gray-700 focus:border-green-500'
              }`}
              placeholder="#YourBrandAd"
            />
            {validationErrors['hashtags.original'] && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors['hashtags.original']}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Repurposed Content Section */}
      {(formData.contentType === 'repurposed' || formData.contentType === 'both') && (
        <div className="p-6 border border-blue-800 bg-blue-900/10 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-blue-400">Repurposed Content</h3>

          {/* Campaign Brief */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Campaign Brief <span className="text-red-500">*</span>
            </label>
            <textarea
              name="brief.repurposed"
              value={formData.brief.repurposed}
              onChange={onChange}
              className={`w-full p-3 bg-transparent border rounded-lg focus:outline-none min-h-32 ${
                validationErrors['brief.repurposed']
                  ? 'border-red-500'
                  : 'border-gray-700 focus:border-red-500'
              }`}
              placeholder="Describe how creators should adapt their existing content for your campaign..."
              required
              rows={4}
            />
            {validationErrors['brief.repurposed'] && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors['brief.repurposed']}
              </p>
            )}
          </div>

          {/* Campaign Guidelines */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <label className="block text-sm font-medium text-gray-300">
                  Content Guidelines <span className="text-red-500">*</span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => onAddGuideline('repurposed')}
                className="text-sm flex items-center text-blue-400 hover:text-blue-300"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Guideline
              </button>
            </div>

            <div className="p-3 bg-black/60 border border-gray-800 rounded-lg mb-4">
              <p className="text-sm text-gray-400">
                Provide clear instructions for creators to follow when adapting existing content
              </p>
            </div>

            <div
              className={`space-y-3 ${
                validationErrors['guidelines.repurposed']
                  ? 'border border-red-500 rounded-lg p-4'
                  : ''
              }`}
            >
              {formData.guidelines.repurposed.map((guideline, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guideline}
                    onChange={(e) =>
                      onGuidelineChange('repurposed', index, e.target.value)
                    }
                    className="flex-1 p-3 bg-transparent border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Add our movie trailer to your existing reaction videos"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => onRemoveGuideline('repurposed', index)}
                      className="p-2 text-gray-400 hover:text-red-400"
                      aria-label="Remove guideline"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {validationErrors['guidelines.repurposed'] && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors['guidelines.repurposed']}
              </p>
            )}
          </div>

          {/* Campaign Hashtag */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-5 w-5 text-purple-400" />
              <label className="block text-sm font-medium text-gray-300">
                Campaign Hashtag <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="p-3 bg-black/60 border border-gray-800 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">
                    <span className="text-yellow-400 font-medium">
                      Include ONE hashtag with #ad
                    </span>{' '}
                    in it (e.g., #MusicAd). This is required for disclosure compliance.
                  </p>
                </div>
              </div>
            </div>

            <input
              type="text"
              name="hashtags.repurposed"
              value={formData.hashtags.repurposed}
              onChange={onChange}
              className={`w-full p-3 bg-transparent border rounded-lg focus:outline-none ${
                validationErrors['hashtags.repurposed']
                  ? 'border-red-500'
                  : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="#YourCampaignAd"
            />
            {validationErrors['hashtags.repurposed'] && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors['hashtags.repurposed']}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Campaign Assets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Image className="h-5 w-5 text-green-400" />
          <label className="block text-sm font-medium text-gray-300">
            Campaign Assets <span className="text-gray-500">(Optional)</span>
          </label>
        </div>

        <div className="p-3 bg-black/60 border border-gray-800 rounded-lg mb-4">
          <p className="text-sm text-gray-400">
            Upload images, videos, logos, or other assets for creators to use in their content
          </p>
        </div>

        <div
          className="border-2 border-dashed border-gray-700 rounded-lg p-6 cursor-pointer hover:border-red-500 transition-colors"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            className="hidden"
            onChange={onFileUpload}
          />
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-500 mb-3" />
            <p className="text-center">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, MP4, PDF (max 10MB per file)
            </p>
          </div>
        </div>

        {formData.assets.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Uploaded Files ({formData.assets.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.assets.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-800 rounded mr-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="p-1 text-gray-400 hover:text-red-400"
                    aria-label="Remove file"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidelinesStep;