import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertCircle, Building, CreditCard } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'payout' | 'earning';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

interface PaymentMethod {
  id: string;
  type: 'bank' | 'paypal';
  name: string;
  lastFour: string;
  default: boolean;
}

const PaymentsView: React.FC = () => {
  const [availableBalance, setAvailableBalance] = useState(1250.50);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('bank-1');

  // Sample payment methods (would come from API in real app)
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bank-1',
      type: 'bank',
      name: 'Chase Bank Account',
      lastFour: '4321',
      default: true
    },
    {
      id: 'paypal-1',
      type: 'paypal',
      name: 'PayPal',
      lastFour: '8765',
      default: false
    }
  ];

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'earning',
      amount: 450.00,
      date: '2024-03-15',
      status: 'completed',
      description: 'Netflix Series Launch Campaign'
    },
    {
      id: '2',
      type: 'payout',
      amount: -1000.00,
      date: '2024-03-10',
      status: 'completed',
      description: 'Bank Transfer'
    },
    {
      id: '3',
      type: 'earning',
      amount: 850.00,
      date: '2024-03-05',
      status: 'completed',
      description: 'Nike Summer Collection Campaign'
    },
    {
      id: '4',
      type: 'payout',
      amount: -500.00,
      date: '2024-02-28',
      status: 'completed',
      description: 'Bank Transfer'
    }
  ];

  const handleInitiatePayoutRequest = () => {
    // First step - move to confirmation screen
    setShowPayoutModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmPayoutRequest = () => {
    // Second step - after confirmation, process the payout
    // Here you would typically make an API call to process the payout
    setAvailableBalance(0);
    setShowConfirmModal(false);
  };

  const getSelectedMethod = () => {
    return paymentMethods.find(method => method.id === selectedMethod) || paymentMethods[0];
  };

  return (
    <div className="space-y-8">
      {/* Balance Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg bg-[#000000] border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-6 w-6 text-green-400" />
            <span className="text-gray-400">Available Balance</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">${availableBalance.toFixed(2)}</p>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              disabled={availableBalance < 50}
            >
              Request Payout
            </button>
          </div>
          {availableBalance < 50 && (
            <p className="text-xs text-yellow-400 mt-2">
              Minimum payout amount: $50.00
            </p>
          )}
        </div>

        <div className="p-6 rounded-lg bg-[#000000] border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <ArrowUpRight className="h-6 w-6 text-blue-400" />
            <span className="text-gray-400">Total Earned</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">$74,600.00</p>
            <div className="text-sm flex items-center gap-1 text-green-400">
              <span>+23%</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-[#000000] border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <ArrowDownRight className="h-6 w-6 text-red-400" />
            <span className="text-gray-400">Total Paid Out</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">$73,349.50</p>
            <div className="text-sm flex items-center gap-1 text-gray-400">
              <span>All Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction History */}
      <section className="p-6 rounded-lg bg-[#000000] border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg bg-[#000000] border border-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'earning' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {transaction.type === 'earning' ? (
                    <ArrowUpRight className="h-5 w-5 text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`text-lg font-bold ${
                  transaction.type === 'earning' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.type === 'earning' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Initial Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-6">
          <div className="bg-[#000000] border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Request Payout</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Available Balance
                </label>
                <p className="text-2xl font-bold text-white">${availableBalance.toFixed(2)}</p>
                <p className="text-sm text-yellow-400 mt-1">
                  Your entire balance will be withdrawn
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Select Payment Method
                </label>
                <div className="space-y-2">
                  {paymentMethods.map(method => (
                    <label 
                      key={method.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 cursor-pointer hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="text-red-500 focus:ring-red-500"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        {method.type === 'bank' ? (
                          <Building className="h-5 w-5 text-blue-400" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-purple-400" />
                        )}
                        <div>
                          <p className="text-white">{method.name}</p>
                          <p className="text-sm text-gray-400">••••{method.lastFour}</p>
                        </div>
                      </div>
                      {method.default && (
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">Default</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-800 rounded-lg text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitiatePayoutRequest}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Continue to Confirmation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-6">
          <div className="bg-[#000000] border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Confirm Payout</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-300">
                    Please carefully review the information below. 
                    Once confirmed, your payout will be processed and cannot be reversed.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Payout Amount</p>
                  <p className="text-xl font-bold text-white">${availableBalance.toFixed(2)}</p>
                </div>
                <hr className="border-gray-800" />
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Payment Method</p>
                  <div className="text-right">
                    <p className="text-white">{getSelectedMethod().name}</p>
                    <p className="text-sm text-gray-400">••••{getSelectedMethod().lastFour}</p>
                  </div>
                </div>
                <hr className="border-gray-800" />
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Processing Time</p>
                  <p className="text-white">1-3 Business Days</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setShowPayoutModal(true);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-800 rounded-lg text-white hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmPayoutRequest}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsView; 