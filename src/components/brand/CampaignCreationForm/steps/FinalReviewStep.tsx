import React from 'react';
import { CreditCard, AlertCircle, FileText, Eye } from 'lucide-react';
import type { CampaignFormData, FieldErrors } from '../types';
import { formatMoney, formatMillions, calculateEstimatedViews, formatDate } from '../utils';

interface FinalReviewStepProps {
  formData: CampaignFormData;
  validationErrors: FieldErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  paymentMethods: Array<{
    id: string;
    type: string;
    last4: string;
    expiry: string;
    isDefault: boolean;
  }>;
  onBack?: () => void;
  onSave?: () => void;
  onSubmit?: () => void;
  isProcessingPayment?: boolean;
}

const FinalReviewStep: React.FC<FinalReviewStepProps> = ({
  formData,
  validationErrors,
  onChange,
  paymentMethods,
  onBack,
  onSave,
  onSubmit,
  isProcessingPayment
}) => {
  const viewEstimates = calculateEstimatedViews(
    formData.budget,
    formData.payoutRate.original,
    formData.payoutRate.repurposed,
    formData.contentType,
    formData.budgetAllocation
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Campaign Review</h2>

      <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold">{formData.title}</h3>
          <span className="px-3 py-1 bg-gray-900/50 text-gray-300 rounded-full text-sm">
            Ready to Submit
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm text-gray-400 mb-1">Content Types</h4>
              <p className="font-medium">
                {formData.contentType === 'original'
                  ? 'Original Content Only'
                  : formData.contentType === 'repurposed'
                  ? 'Repurposed Content Only'
                  : 'Both Original & Repurposed Content'}
              </p>
            </div>

            <div>
              <h4 className="text-sm text-gray-400 mb-1">Platforms</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(formData.platforms)
                  .filter(([_, isEnabled]) => isEnabled)
                  .map(([platform]) => (
                    <span
                      key={platform}
                      className="px-3 py-1 bg-black/40 border border-gray-700 rounded-lg text-sm"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm text-gray-400 mb-1">
                Campaign Duration
              </h4>
              <p className="font-medium">
                {formatDate(formData.startDate)} to{' '}
                {formatDate(formData.endDate)}
              </p>
            </div>

            <div>
              <h4 className="text-sm text-gray-400 mb-1">Budget & Views</h4>
              <p className="text-xl font-bold break-words">
                {formData.budget
                  ? formatMoney(parseInt(formData.budget))
                  : '$0'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-green-400">
                <Eye className="h-4 w-4 flex-shrink-0" />
                <p className="break-words">{formatMillions(viewEstimates.totalViews)} estimated views</p>
              </div>
              
              {/* Show detailed breakdown for both content types */}
              {formData.contentType === 'both' && (
                <div className="mt-2 border-t border-gray-700 pt-2 space-y-1">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Original ({formData.budgetAllocation.original}%):</span>
                    <span className="text-green-400 break-words">{formatMillions(viewEstimates.originalViews)} views</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Repurposed ({formData.budgetAllocation.repurposed}%):</span>
                    <span className="text-green-400 break-words">{formatMillions(viewEstimates.repurposedViews)} views</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm text-gray-400 mb-1">Payment Method</h4>
              {formData.paymentMethod ? (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-300" />
                  <p className="font-medium">
                    {
                      paymentMethods.find(
                        (m) => m.id === formData.paymentMethod
                      )?.type || 'Card'
                    }{' '}
                    ••••
                    {
                      paymentMethods.find(
                        (m) => m.id === formData.paymentMethod
                      )?.last4
                    }
                  </p>
                </div>
              ) : (
                <p className="text-yellow-400">No payment method selected</p>
              )}
            </div>

            <div>
              <h4 className="text-sm text-gray-400 mb-1">View Rates</h4>
              <div className="space-y-2">
                {(formData.contentType === 'original' ||
                  formData.contentType === 'both') && (
                  <div className="flex justify-between">
                    <span>Original Content:</span>
                    <span className="font-medium">
                      ${formData.payoutRate.original} <span className="text-gray-300">per 1M views</span>
                    </span>
                  </div>
                )}
                {(formData.contentType === 'repurposed' ||
                  formData.contentType === 'both') && (
                  <div className="flex justify-between">
                    <span>Repurposed Content:</span>
                    <span className="font-medium">
                      ${formData.payoutRate.repurposed} <span className="text-gray-300">per 1M views</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {formData.contentType === 'both' && (
              <div>
                <h4 className="text-sm text-gray-400 mb-1">
                  Budget Allocation
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-300">Original Content:</p>
                    <p className="font-medium">
                      {formData.budgetAllocation.original}%
                    </p>
                    <p className="text-sm text-green-400 mt-1 break-words">
                      {formatMoney(parseInt(formData.budget || '0') * formData.budgetAllocation.original / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300">Repurposed Content:</p>
                    <p className="font-medium">
                      {formData.budgetAllocation.repurposed}%
                    </p>
                    <p className="text-sm text-green-400 mt-1 break-words">
                      {formatMoney(parseInt(formData.budget || '0') * formData.budgetAllocation.repurposed / 100)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.assets.length > 0 && (
              <div>
                <h4 className="text-sm text-gray-400 mb-1">Assets</h4>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-300 mr-2" />
                  <p>
                    {formData.assets.length} file
                    {formData.assets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="flex items-start gap-2 mb-6">
          <div className="mt-0.5">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={onChange}
              className={`rounded text-red-500 focus:ring-red-500 ${
                validationErrors['termsAccepted'] ? 'border-red-500' : ''
              }`}
            />
          </div>
          <label htmlFor="termsAccepted" className="text-sm leading-relaxed text-gray-300">
            I understand that by submitting this campaign for review, I
            authorize CREATE_OS to charge my selected payment method for the
            campaign budget amount upon approval. I understand that my budget
            will be used to deliver the views calculated above. If my campaign
            doesn't use the full budget within the campaign period, I will
            receive a refund or credit for the unused portion.
          </label>
        </div>
        {validationErrors['termsAccepted'] && (
          <p className="mt-1 text-sm text-red-500">
            {validationErrors['termsAccepted']}
          </p>
        )}
      </div>

      {/* Payment authorization notice */}
      <div className="p-4 bg-yellow-900/10 border border-yellow-800 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-400 mb-1">
              Payment Authorization
            </h4>
            <p className="text-sm text-gray-300">
              By submitting this campaign for review, your selected payment
              method will be charged
              {formData.budget ? ' ' + formatMoney(parseInt(formData.budget)) : ''}{' '}
              upon approval. This budget will deliver approximately{' '}
              {formatMillions(viewEstimates.totalViews)} views for your
              campaign. Any unused budget at the end of the campaign period
              will be refunded or credited to your account.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6">
        <div className="flex gap-3">
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="px-6 py-3 border border-red-500 text-red-500 rounded-lg hover:bg-red-900/20"
              disabled={isProcessingPayment}
            >
              Save as Draft
            </button>
          )}

          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 transition-colors rounded-lg text-white flex items-center gap-2"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>Submit for Review</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalReviewStep;