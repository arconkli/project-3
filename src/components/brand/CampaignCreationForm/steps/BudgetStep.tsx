import React from 'react';
import { DollarSign, Eye, Info } from 'lucide-react';
import type { CampaignFormData, FieldErrors } from '../types';
import { calculateEstimatedViews, formatMoney, formatMillions } from '../utils';

interface BudgetStepProps {
  formData: CampaignFormData;
  validationErrors: FieldErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BudgetStep: React.FC<BudgetStepProps> = ({
  formData,
  validationErrors,
  onChange,
}) => {
  const viewEstimates = calculateEstimatedViews(
    formData.budget,
    formData.payoutRate.original,
    formData.payoutRate.repurposed,
    formData.contentType,
    formData.budgetAllocation
  );

  return (
    <div className="space-y-6" role="group" aria-labelledby="budget-section">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-5 w-5 text-green-400" />
          <label
            id="budget-section"
            htmlFor="budget"
            className="block text-sm font-medium text-gray-300"
          >
            Total Campaign Budget <span className="text-red-500">*</span>
          </label>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="budget"
            name="budget"
            type="number"
            value={formData.budget}
            onChange={onChange}
            min="1000"
            step="1"
            className={`w-full p-3 pl-10 bg-transparent border rounded-lg focus:outline-none ${
              validationErrors['budget']
                ? 'border-red-500'
                : 'border-gray-700 focus:border-red-500'
            }`}
            placeholder="5000"
            required
          />
          {validationErrors['budget'] && (
            <p className="mt-1 text-sm text-red-500">
              {validationErrors['budget']}
            </p>
          )}
        </div>

        <div className="flex items-center p-3 mt-2 bg-black/40 border border-gray-800 rounded-lg">
          <Info className="h-5 w-5 text-gray-400 mr-3" />
          <p className="text-sm text-gray-400">
            You pay for the views your campaign receives. Minimum budget: $1,000
          </p>
        </div>
      </div>

      <div className="p-5 rounded-lg bg-black/40 border border-gray-800">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-400" />
            <span>View Rates</span>
          </h3>
          <div className="flex items-center p-2 rounded-lg bg-blue-900/20 border border-blue-800 text-xs text-blue-400">
            <Info className="h-4 w-4 mr-1" />
            <span>Pay per 1M views</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Original Content Rate */}
          {(formData.contentType === 'original' ||
            formData.contentType === 'both') && (
            <div>
              <div className="flex justify-between mb-2">
                <label
                  htmlFor="payoutRate.original"
                  className="block text-sm font-medium text-gray-300"
                >
                  Original Content Rate <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">Minimum: $500</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="payoutRate.original"
                  name="payoutRate.original"
                  type="number"
                  value={formData.payoutRate.original}
                  onChange={onChange}
                  min="500"
                  className={`w-full p-3 pl-10 bg-transparent border rounded-lg focus:outline-none transition-colors ${
                    validationErrors['payoutRate.original']
                      ? 'border-red-500'
                      : 'border-gray-700 focus:border-red-500'
                  }`}
                  placeholder="500"
                  required={
                    formData.contentType === 'original' ||
                    formData.contentType === 'both'
                  }
                />
                {validationErrors['payoutRate.original'] && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors['payoutRate.original']}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rate for brand-new content created specifically for your campaign
              </p>
            </div>
          )}

          {/* Repurposed Content Rate */}
          {(formData.contentType === 'repurposed' ||
            formData.contentType === 'both') && (
            <div>
              <div className="flex justify-between mb-2">
                <label
                  htmlFor="payoutRate.repurposed"
                  className="block text-sm font-medium text-gray-300"
                >
                  Repurposed Content Rate <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">Minimum: $250</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="payoutRate.repurposed"
                  name="payoutRate.repurposed"
                  type="number"
                  value={formData.payoutRate.repurposed}
                  onChange={onChange}
                  min="250"
                  className={`w-full p-3 pl-10 bg-transparent border rounded-lg focus:outline-none transition-colors ${
                    validationErrors['payoutRate.repurposed']
                      ? 'border-red-500'
                      : 'border-gray-700 focus:border-red-500'
                  }`}
                  placeholder="250"
                  required={
                    formData.contentType === 'repurposed' ||
                    formData.contentType === 'both'
                  }
                />
                {validationErrors['payoutRate.repurposed'] && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors['payoutRate.repurposed']}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rate for existing content adapted to include your campaign messaging
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Allocation (only if "both" content types selected) */}
      {formData.contentType === 'both' && (
        <div className="mt-4 p-5 bg-purple-900/10 border border-purple-800 rounded-lg">
          <h3 className="font-medium mb-3">Budget Allocation</h3>
          <div className="mb-2 flex justify-between text-sm text-gray-400">
            <span>Original: {formData.budgetAllocation.original}%</span>
            <span>Repurposed: {formData.budgetAllocation.repurposed}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.budgetAllocation.original}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              const event = {
                target: { 
                  name: 'budgetAllocation.original',
                  value: value.toString()
                }
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(event);
              
              // Also update repurposed
              const repurposedEvent = {
                target: {
                  name: 'budgetAllocation.repurposed',
                  value: (100 - value).toString()
                }
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(repurposedEvent);
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* View Calculator */}
      <div className="p-5 rounded-lg bg-green-900/10 border border-green-800" role="region" aria-label="Estimated campaign reach">
        <h3 className="font-medium text-lg text-green-400 mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Estimated Campaign Reach
        </h3>

        <div className="space-y-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-6">
            {(formData.contentType === 'both' ||
              formData.contentType === 'original') && (
              <div className="p-4 bg-black/40 border border-gray-800 rounded-lg" role="group" aria-label="Original content estimates">
                <p className="text-sm text-gray-400 mb-1">Original Content</p>
                <p className="text-2xl font-bold text-white break-words">
                  {formatMillions(viewEstimates.originalViews)} views
                </p>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="break-words">
                  {formData.budget && formData.contentType === 'both'
                    ? formatMoney(
                        parseInt(formData.budget) *
                          formData.budgetAllocation.original /
                          100
                      )
                    : formatMoney(parseInt(formData.budget) || 0)}
                  </span>
                </div>
              </div>
            )}

            {(formData.contentType === 'both' ||
              formData.contentType === 'repurposed') && (
              <div className="p-4 bg-black/40 border border-gray-800 rounded-lg" role="group" aria-label="Repurposed content estimates">
                <p className="text-sm text-gray-400 mb-1">Repurposed Content</p>
                <p className="text-2xl font-bold text-white break-words">
                  {formatMillions(viewEstimates.repurposedViews)} views
                </p>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="break-words">
                  {formData.budget && formData.contentType === 'both'
                    ? formatMoney(
                        parseInt(formData.budget) *
                          formData.budgetAllocation.repurposed /
                          100
                      )
                    : formatMoney(parseInt(formData.budget) || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg" role="group" aria-label="Total campaign estimates">
            <p className="text-sm text-gray-400 mb-1">Total Estimated Views</p>
            <div className="flex flex-wrap justify-between items-end">
              <p className="text-3xl font-bold text-green-400 break-words mr-2">
                {formatMillions(viewEstimates.totalViews)} views
              </p>
              <p className="text-lg font-medium text-white break-words">
                {formData.budget ? formatMoney(parseInt(formData.budget)) : '$0'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetStep;