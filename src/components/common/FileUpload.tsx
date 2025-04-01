// src/components/common/FileUpload.tsx
import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { FileUploadProps } from '../../types';

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.nii.gz')) {
      setError('Please upload a .nii.gz file');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-blue-200 hover:border-blue-300'
        } transition-all duration-200 ease-in-out group`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".nii.gz"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg font-medium text-blue-900 mb-2">
            Drop your scan file here
          </p>
          <p className="text-blue-600">
            or click to browse
          </p>
          <p className="mt-2 text-sm text-blue-400">
            Supported format: .nii.gz
          </p>
        </div>
      </div>
      {error && (
        <div className="mt-3 flex items-center text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};