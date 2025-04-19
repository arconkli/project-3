import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Download, Receipt, CreditCard, DollarSign, Plus, Trash2, Filter, Search } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import type { Transaction, PaymentMethod } from '@/types/brand';

// Sample transactions data
const transactions: Transaction[] = [
  {
    id: 'txn_1',
    type: 'charge',
    amount: 5000,
    date: '2025-03-10',
    status: 'completed',
    description: 'Campaign funding',
    campaignId: 'camp_1',
    campaignTitle: 'Summer Product Launch',
    paymentMethod: {
      type: 'visa',
      last4: '4242'
    }
  },
  {
    id: 'txn_2',
    type: 'refund',
    amount: 1200,
    date: '2025-03-08',
    status: 'completed',
    description: 'Unused campaign budget refund',
    campaignId: 'camp_2',
    campaignTitle: 'Spring Collection',
    paymentMethod: {
      type: 'visa',
      last4: '4242'
    }
  }
];

// Sample payment methods
const paymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'credit_card',
    status: 'active',
    isDefault: true,
    createdAt: '2025-01-15',
    details: {
      last4: '4242',
      brand: 'visa',
      expiryMonth: '12',
      expiryYear: '25',
      cardholderName: 'John Smith',
      billingAddress: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US'
      }
    }
  },
  {
    id: 'pm_2',
    type: 'ach',
    status: 'active',
    isDefault: false,
    createdAt: '2025-02-01',
    details: {
      bankName: 'Chase',
      accountType: 'checking',
      last4: '4321',
      routingNumber: '123456789',
      accountHolderName: 'John Smith',
      accountHolderType: 'individual',
      billingAddress: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US'
      }
    }
  }
];

const BrandBilling = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="space-y-8">
      {/* Payment Methods */}
      <section className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-400" />
            Payment Methods
          </h2>
          
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg ${
                method.isDefault
                  ? 'border-green-500 bg-green-900/10'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {method.type === 'credit_card' ? (
                    <CreditCard className="h-5 w-5 text-blue-400" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-green-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {method.type === 'credit_card'
                          ? `${method.details.brand.toUpperCase()} ****${method.details.last4}`
                          : `${method.details.bankName} ****${method.details.last4}`}
                      </p>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-green-900/20 text-green-400 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {method.type === 'credit_card'
                        ? `Expires ${method.details.expiryMonth}/${method.details.expiryYear}`
                        : method.details.accountType.charAt(0).toUpperCase() + method.details.accountType.slice(1)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <button
                      className="px-3 py-1.5 border border-gray-700 rounded text-sm hover:bg-white/5"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    className="p-2 border border-gray-700 rounded hover:bg-red-900/20 hover:border-red-500 group"
                    aria-label="Remove payment method"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction History */}
      <section className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold">Transaction History</h2>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-black/40 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Search transactions..."
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-black/40 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-black/40 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Types</option>
                <option value="charge">Charges</option>
                <option value="refund">Refunds</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 bg-black/40 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>

              <button
                className="px-4 py-2 border border-gray-700 rounded-lg flex items-center gap-2 hover:bg-white/5 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-4 border border-gray-700 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {transaction.type === 'charge' ? (
                    <ArrowUpRight className="h-5 w-5 text-red-400 mt-1" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5 text-green-400 mt-1" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    {transaction.campaignTitle && (
                      <p className="text-sm text-gray-400">
                        Campaign: {transaction.campaignTitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Receipt className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-400">
                        {transaction.paymentMethod.type.toUpperCase()} ****{transaction.paymentMethod.last4}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type === 'charge' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {transaction.type === 'charge' ? '-' : '+'}${formatMoney(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${
                    transaction.status === 'completed'
                      ? 'bg-green-900/20 text-green-400'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-900/20 text-yellow-400'
                      : 'bg-red-900/20 text-red-400'
                  }`}>
                    {transaction.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BrandBilling;