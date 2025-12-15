import React, { useRef } from 'react';

interface FileUploadProps {
  accept: string;
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  label: string;
  icon: React.ReactNode;
  subLabel?: string;
  compact?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  onFilesSelected,
  multiple = false,
  label,
  icon,
  subLabel,
  compact = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
    // Reset value so same file can be selected again if needed
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter by accept type roughly
      const acceptedFiles = Array.from(e.dataTransfer.files).filter((file: File) => {
        if (accept.includes('image') && file.type.startsWith('image/')) return true;
        if (accept.includes('audio') && file.type.startsWith('audio/')) return true;
        if (accept.includes('.srt') && file.name.endsWith('.srt')) return true;
        return false;
      });
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`
        relative border-2 border-dashed border-slate-700 hover:border-blue-500 
        rounded-xl cursor-pointer transition-all duration-200 group
        bg-slate-800/50 hover:bg-slate-800
        flex flex-col items-center justify-center text-center
        ${compact ? 'p-4' : 'p-8'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="text-slate-400 group-hover:text-blue-400 transition-colors mb-2">
        {icon}
      </div>
      <p className="font-semibold text-slate-200 text-sm">{label}</p>
      {!compact && subLabel && (
        <p className="text-xs text-slate-500 mt-1">{subLabel}</p>
      )}
    </div>
  );
};