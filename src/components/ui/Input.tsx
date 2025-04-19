import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg focus:border-gray-500 focus:outline-none";
  const errorStyles = error ? "border-red-500" : "";
  const disabledStyles = props.disabled ? "opacity-70 cursor-not-allowed" : "";
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-gray-400 mb-1">
          {label}
        </label>
      )}
      
      <input
        className={`${baseStyles} ${errorStyles} ${disabledStyles} ${className}`}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input; 