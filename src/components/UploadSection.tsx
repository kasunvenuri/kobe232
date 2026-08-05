import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, FilePlus, AlertCircle, Play, CheckCircle2 } from 'lucide-react';
import { DocumentFile } from '../types';

interface UploadSectionProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  onProcessAllPending: () => void;
  pendingCount: number;
  isProcessing: boolean;
  totalDocs: number;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFilesSelected,
  onLoadSamples,
  onProcessAllPending,
  pendingCount,
  isProcessing,
  totalDocs,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      onFilesSelected(fileList);
      e.target.value = ''; // reset
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter((file: File) =>
        file.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            Document Upload
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Upload Loading Invoice Summaries (PNG, JPG, JPEG). KOBE OCR extracts <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">GRAY highlighted rows</span> only.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onLoadSamples}
            type="button"
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Sample Invoices
          </button>

          {pendingCount > 0 && (
            <button
              onClick={onProcessAllPending}
              disabled={isProcessing}
              type="button"
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Process {pendingCount} {pendingCount === 1 ? 'Doc' : 'Docs'}
            </button>
          )}
        </div>
      </div>

      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center bg-slate-50 ${
          isDragOver
            ? 'border-blue-600 bg-blue-50/50 scale-[1.002]'
            : 'border-slate-200 hover:border-blue-500 hover:bg-slate-100/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6 text-blue-600" />
        </div>

        <p className="text-sm font-bold text-slate-800">
          Drag & Drop Invoice Images
        </p>
        <p className="text-xs text-slate-400 mt-1">
          PNG, JPG, JPEG supported • Upload multiple files simultaneously
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
        >
          Browse Files
        </button>
      </div>
    </div>
  );
};
