import React from 'react';
import { DollarSign, AlertCircle, Plus, CreditCard } from 'lucide-react';
import type { CampaignFormData, FieldErrors } from '../types';
import { formatMoney, formatMillions, calculateEstimatedViews } from '../utils';

interface PaymentStepProps {
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
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  formData,
  validationErrors,
  onChange,
  paymentMethods,
}) => {
  const viewEstimates = calculateEstimatedViews(
    formData.budget,
    formData.payoutRate.original,
    formData.payoutRate.repurposed,
    formData.contentType,
    formData.budgetAllocation
  );

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-lg bg-black/40 border border-gray-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-black/60 rounded-lg border border-green-700">
            <DollarSign className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              Payment on Approval
            </h3>
            <p className="text-gray-400 mb-4">
              When your campaign is approved, your payment method will be
              charged immediately for the full campaign budget:{' '}
              <span className="font-bold text-white">
                {formData.budget
                  ? formatMoney(parseInt(formData.budget))
                  : '$0'}
              </span>
            </p>

            <div className="p-3 bg-yellow-900/10 border border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Your campaign must have valid payment information before it
                  can be reviewed and published.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>

        <div
          className={`space-y-3 ${
            validationErrors['paymentMethod']
              ? 'border border-red-500 rounded-lg p-4'
              : ''
          }`}
        >
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${
                formData.paymentMethod === method.id
                  ? 'border-green-500 bg-green-900/10'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={formData.paymentMethod === method.id}
                  onChange={onChange}
                  className="hidden"
                />
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {method.type.charAt(0).toUpperCase() + method.type.slice(1)}{' '}
                    •••• {method.last4}
                  </p>
                  <p className="text-sm text-gray-400">Expires {method.expiry}</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                  formData.paymentMethod === method.id
                    ? 'border-green-500'
                    : 'border-gray-600'
                }`}
              >
                {formData.paymentMethod === method.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                )}
              </div>
            </label>
          ))}

          <button
            type="button"
            className="flex items-center gap-2 mt-2 text-sm text-red-400 hover:text-red-300"
          >
            <Plus className="h-4 w-4" /> Add New Payment Method
          </button>
        </div>
        {validationErrors['paymentMethod'] && (
          <p className="mt-1 text-sm text-red-500">
            {validationErrors['paymentMethod']}
          </p>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-lg font-medium mb-4">Campaign Budget Summary</h3>

        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <p className="text-gray-300">Campaign Budget:</p>
              <p className="font-bold">
                {formData.budget ? formatMoney(parseInt(formData.budget)) : '$0'}
              </p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-300">Estimated Views:</p>
              <p className="font-bold text-green-400">
                {formatMillions(viewEstimates.totalViews)}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <div className="flex justify-between">
                <p className="text-gray-300">Content Types:</p>
                <p className="font-medium">
                  {formData.contentType === 'original'
                    ? 'Original Only'
                    : formData.contentType === 'repurposed'
                    ? 'Repurposed Only'
                    : 'Original & Repurposed'}
                </p>
              </div>

              {formData.contentType === 'both' && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-400">
                      Original ({formData.budgetAllocation.original}%):
                    </p>
                    <p>
                      {formatMoney(
                        parseInt(formData.budget || '0') *
                          formData.budgetAllocation.original /
                          100
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm text-green-400 mt-1 mb-2">
                    <p className="text-gray-400">Estimated Views:</p>
                    <p>{formatMillions(viewEstimates.originalViews)}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-400">
                      Repurposed ({formData.budgetAllocation.repurposed}%):
                    </p>
                    <p>
                      {formatMoney(
                        parseInt(formData.budget || '0') *
                          formData.budgetAllocation.repurposed /
                          100
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm text-green-400 mt-1">
                    <p className="text-gray-400">Estimated Views:</p>
                    <p>{formatMillions(viewEstimates.repurposedViews)}</p>
                  </div>
                </div>
              )}
              
              {formData.contentType === 'original' && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-400">
                      Rate per 1M views:
                    </p>
                    <p>${formData.payoutRate.original}</p>
                  </div>
                  <div className="flex justify-between text-sm text-green-400 mt-1">
                    <p className="text-gray-400">Estimated Views:</p>
                    <p>{formatMillions(viewEstimates.originalViews)}</p>
                  </div>
                </div>
              )}
              
              {formData.contentType === 'repurposed' && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-400">
                      Rate per 1M views:
                    </p>
                    <p>${formData.payoutRate.repurposed}</p>
                  </div>
                  <div className="flex justify-between text-sm text-green-400 mt-1">
                    <p className="text-gray-400">Estimated Views:</p>
                    <p>{formatMillions(viewEstimates.repurposedViews)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;