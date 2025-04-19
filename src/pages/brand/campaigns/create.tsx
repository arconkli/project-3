import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import CampaignCreationForm from '@/components/brand/CampaignCreationForm';

const CampaignCreationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = () => {
    if (isEditMode) {
      // If in edit mode, confirm before canceling to prevent data loss
      setShowCancelConfirm(true);
    } else {
      // Otherwise, just navigate back
      navigate('/brand/dashboard');
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    navigate('/brand/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black relative"
      role="main"
    >
      <CampaignCreationForm 
        onCancel={handleCancel}
        onComplete={() => navigate('/brand/dashboard')}
      />

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4">
          <div className="bg-black border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Discard Changes?</h3>
            <p className="text-gray-300 mb-6">
              You have unsaved changes to this campaign. Are you sure you want to discard these changes?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Continue Editing
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CampaignCreationPage;