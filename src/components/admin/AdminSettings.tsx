import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Shield, Check } from 'lucide-react';
import type { AdminUser, AdminPermissions } from '@/types/admin';

interface AdminSettingsProps {
  onCreateAdmin: (adminData: Partial<AdminUser>) => void;
}

// Sample admin users data
const SAMPLE_ADMINS = [
  {
    id: '1',
    name: 'John Admin',
    email: 'john@admin.com',
    role: 'superadmin',
    permissions: {
      reviews: true,
      tickets: true,
      campaigns: true,
      users: true,
      settings: true,
      payments: true,
      reports: true,
      audit: true
    },
    lastLogin: '2025-03-12T10:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Moderator',
    email: 'jane@admin.com',
    role: 'moderator',
    permissions: {
      reviews: true,
      tickets: true,
      campaigns: false,
      users: false,
      settings: false,
      payments: false,
      reports: true,
      audit: false
    },
    lastLogin: '2025-03-12T09:00:00Z'
  }
];
const DEFAULT_PERMISSIONS: AdminPermissions = {
  reviews: false,
  tickets: false,
  campaigns: false,
  users: false,
  settings: false,
  payments: false,
  reports: false,
  audit: false
};

const AdminSettings: React.FC<AdminSettingsProps> = ({ onCreateAdmin }) => {
  const [showNewAdminModal, setShowNewAdminModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<string | null>(null);
  const [newAdminData, setNewAdminData] = useState<Partial<AdminUser>>({
    role: 'moderator',
    permissions: DEFAULT_PERMISSIONS
  });

  const handleEditPermissions = (adminId: string) => {
    setEditingAdmin(adminId);
  };

  const handleDeleteAdmin = (adminId: string) => {
    console.log('Delete admin:', adminId);
    setShowDeleteConfirm(null);
  };

  const handleCreateAdmin = () => {
    onCreateAdmin(newAdminData);
    setShowNewAdminModal(false);
  };

  return (
    <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Admin Management</h2>
        <button
          onClick={() => setShowNewAdminModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Admin
        </button>
      </div>
      <div className="space-y-6">
        {/* Admin List */}
        <div className="space-y-4">
          {SAMPLE_ADMINS.map((admin) => (
            <div
              key={admin.id}
              className="p-4 border border-gray-800 rounded-lg bg-black/20"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{admin.name}</h3>
                    <p className="text-sm text-gray-400">{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      admin.role === 'superadmin' 
                        ? 'bg-red-900/20 text-red-400'
                        : admin.role === 'admin'
                        ? 'bg-blue-900/20 text-blue-400'
                        : 'bg-gray-900/20 text-gray-400'
                    }`}>
                      {admin.role.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {Object.entries(admin.permissions).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-2 rounded ${
                        value ? 'bg-green-900/20 text-green-400' : 'bg-gray-900/20 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {value && <Check className="h-3 w-3" />}
                        <span className="text-xs capitalize">{key}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400">
                    Last login: {new Date(admin.lastLogin).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPermissions(admin.id)}
                      className="px-3 py-1.5 border border-gray-700 rounded text-sm hover:bg-white/5"
                    >
                      Edit Permissions
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(admin.id)}
                      className="px-3 py-1.5 border border-red-500 text-red-400 rounded text-sm hover:bg-red-900/20"
                    >
                      Remove Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Admin Modal */}
      {showNewAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Add New Admin</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 bg-black/40 border border-gray-700 rounded"
                  value={newAdminData.name || ''}
                  onChange={e => setNewAdminData({...newAdminData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 bg-black/40 border border-gray-700 rounded"
                  value={newAdminData.email || ''}
                  onChange={e => setNewAdminData({...newAdminData, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Role</label>
                <select
                  className="w-full p-2 bg-black/40 border border-gray-700 rounded"
                  value={newAdminData.role}
                  onChange={e => setNewAdminData({...newAdminData, role: e.target.value as AdminUser['role']})}
                >
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-2">Permissions</label>
                <div className="space-y-2">
                  {Object.entries(DEFAULT_PERMISSIONS).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newAdminData.permissions?.[key as keyof AdminPermissions] || false}
                        onChange={e => setNewAdminData({
                          ...newAdminData,
                          permissions: {
                            ...newAdminData.permissions,
                            [key]: e.target.checked
                          }
                        })}
                        className="rounded border-gray-700 text-red-500"
                      />
                      <span className="capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewAdminModal(false)}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdmin}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;