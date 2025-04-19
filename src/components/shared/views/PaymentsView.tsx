import { memo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, CreditCard, Ban as Bank, Plus, Download, ArrowUpRight, AlertCircle, Check, Info } from 'lucide-react';
import { useState } from 'react';

const PaymentsView = memo(() => {
  const [showRequestPayout, setShowRequestPayout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [error, setError] = useState('');
  
  const availableBalance = 2850; // This would come from your API
  const paymentMethods = [
    { id: 'bank', label: 'Bank Account', details: '****4321' },
    { id: 'paypal', label: 'PayPal', details: 'creator@email.com' }
  ];

  const handleRequestPayout = () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }
    
    // In a real app, this would make an API call
    console.log('Requesting full payout:', {
      amount: availableBalance,
      method: selectedMethod
    });
    
    // Reset form and close dialog
    setSelectedMethod('');
    setShowRequestPayout(false);
  };

  return (
    <div className="space-y-10">
      {/* Payment Summary */}
      <section aria-labelledby="payment-summary" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <h2 id="payment-summary" className="sr-only">Payment Summary</h2>

        <div className="p-6 rounded-lg bg-[#000000] border border-gray-800">
          <h3 className="text-xl font-medium mb-2 text-gray-300">Total Earned</h3>
          <p className="text-3xl font-bold mb-3 text-white">$74,600</p>
          <div className="flex items-center text-sm text-green-400">
            <TrendingUp className="h-4 w-4 mr-1" aria-hidden="true" />
            <span>+23% from last period</span>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-[#000000] border border-gray-800">
          <h3 className="text-xl font-medium mb-2 text-gray-300">Available Balance</h3>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-3xl font-bold mb-1 text-white">${availableBalance}</p>
              <p className="text-sm text-gray-400">Full amount will be withdrawn</p>
            </div>
            {availableBalance >= 50 ? (
              <button
                onClick={() => setShowRequestPayout(true)}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-900/20"
              >
                Withdraw All Funds
                <ArrowUpRight className="h-5 w-5" />
              </button>
            ) : (
              <p className="text-sm text-yellow-400 mt-2">
                Minimum payout amount is $50
              </p>
            )}
          </div>
        </div>

        <div className="p-6 rounded-lg bg-[#000000] border border-gray-800">
          <h3 className="text-xl font-medium mb-2 text-gray-300">Total Paid Out</h3>
          <p className="text-3xl font-bold mb-3 text-white">$71,750</p>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-1" aria-hidden="true" />
            <span>All time</span>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section aria-labelledby="payment-methods" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="payment-methods" className="text-xl font-bold text-white">Payment Methods</h2>
          <button className="px-4 py-2 bg-[#000000] border border-gray-800 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-gray-300 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Method
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[#000000] border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-[#000000] border border-gray-800">
                <Bank className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-300">Bank Account</p>
                <p className="text-sm text-gray-400">****4321</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-3 py-1 text-sm border border-gray-700 rounded hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-gray-300">
                Make Default
              </button>
              <button className="px-3 py-1 text-sm border border-gray-700 rounded hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-gray-300">
                Edit
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#000000] border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-[#000000] border border-gray-800">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51 10.94 9.51 10.02C9.51 9.18 10.16 8.49 10.96 8.49H12.84C13.76 8.49 14.51 9.27 14.51 10.24" />
                  <path d="M12 7.5V16.5" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-300">PayPal</p>
                <p className="text-sm text-gray-400">creator@example.com</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-3 py-1 text-sm border border-gray-700 rounded hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-gray-300">
                Make Default
              </button>
              <button className="px-3 py-1 text-sm border border-gray-700 rounded hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-gray-300">
                Edit
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Request Payout Modal */}
      {showRequestPayout && (
        <div className="fixed inset-0 bg-[#000000] flex items-center justify-center p-4 z-50 overflow-hidden">
          <div className="bg-[#000000] border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2 text-white">Withdraw All Funds</h3>
            <p className="text-sm text-gray-400 mb-6">Your entire available balance of ${availableBalance} will be withdrawn to your selected payment method.</p>
            
            <div className="space-y-6">
              {/* Available Balance */}
              <div className="p-4 bg-[#000000] border border-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">Available Balance</p>
                <p className="text-2xl font-bold text-white">${availableBalance}</p>
                <p className="text-sm text-red-400 mt-1">This entire amount will be withdrawn</p>
              </div>
              
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Select Payment Method
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMethod === method.id
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-800 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="text-red-500 focus:ring-red-500"
                      />
                      <div>
                        <p className="text-white">{method.label}</p>
                        <p className="text-sm text-gray-400">{method.details}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestPayout(false);
                  setSelectedMethod('');
                  setError('');
                }}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5 text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
              >
                Withdraw All Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PaymentsView.displayName = 'PaymentsView';

export default PaymentsView;