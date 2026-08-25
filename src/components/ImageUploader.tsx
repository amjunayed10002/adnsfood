import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, RefreshCw } from 'lucide-react';

interface PresetItem {
  label: string;
  url: string;
}

interface ImageUploaderProps {
  label?: string;
  value: string;
  onChange: (urlOrDataUrl: string) => void;
  presets?: PresetItem[];
  helpText?: string;
  aspectRatioHint?: string;
  className?: string;
}

/**
 * Resizes and compresses image files from device to high quality web resolution data URLs
 */
const processDeviceImage = (file: File, maxDimension = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If SVG, read directly as data URL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = 'Image',
  value,
  onChange,
  presets = [],
  helpText,
  aspectRatioHint,
  className = '',
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDataUrl = value && value.startsWith('data:image/');

  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, SVG).');
      return;
    }
    setIsProcessing(true);
    try {
      setUploadFileName(file.name);
      const dataUrl = await processDeviceImage(file);
      onChange(dataUrl);
    } catch (err) {
      console.error('Failed to read image file:', err);
      alert('Failed to process image file from your device.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    onChange('');
    setUploadFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Mode Switch */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label} {aspectRatioHint && <span className="font-normal text-slate-400">({aspectRatioHint})</span>}
        </label>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              mode === 'upload' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload from Device</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              mode === 'url' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Upload from Device Mode */}
      {mode === 'upload' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-rose-500 bg-rose-50/80 scale-[1.01]'
                : 'border-slate-300 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/30'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center py-2 text-rose-600 gap-1.5">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-xs font-bold">Optimizing & Uploading Image...</span>
              </div>
            ) : value ? (
              <div className="flex items-center gap-3 w-full justify-between px-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <img
                    src={value}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-rose-200 shrink-0 bg-white shadow-2xs"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">
                      {uploadFileName || (isDataUrl ? 'Uploaded from your device' : 'Active Image Selected')}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3" /> Image Ready & Loaded
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click to browse or drag & drop an image from your device
                </p>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP, SVG</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* URL Input Mode */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={isDataUrl ? '' : value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://images.unsplash.com/... or paste direct image URL"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
            />
            {value && (
              <div className="relative group shrink-0">
                <img
                  src={value}
                  alt="Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-xs cursor-pointer"
                  title="Clear"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Presets if provided */}
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-500">Quick Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                onChange(p.url);
                setUploadFileName(null);
              }}
              className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold border border-slate-200 cursor-pointer transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {helpText && <p className="text-[10px] text-slate-500">{helpText}</p>}
    </div>
  );
};
