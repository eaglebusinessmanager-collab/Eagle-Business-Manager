import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Link,
  Sparkles,
  Camera,
  Check,
} from 'lucide-react';
import { uploadFileToStorage } from '../../lib/firebase';

interface ProductImageUploaderProps {
  imageUrl: string;
  onChange: (url: string) => void;
  productName?: string;
}

// Curated high quality presets for retail merchants
const PRESET_TEMPLATES = [
  {
    name: 'Smart TV',
    category: 'Electronics',
    url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Headphones',
    category: 'Audio',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Smartphone',
    category: 'Mobile',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff025a5?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Solar Inverter',
    category: 'Energy',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Sneakers / Shoes',
    category: 'Fashion',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Groceries / Fruit',
    category: 'Food',
    url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Perfume / Beauty',
    category: 'Cosmetics',
    url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Beverage / Drink',
    category: 'Beverage',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=500&q=80',
  },
];

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  imageUrl,
  onChange,
  productName,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState(imageUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress & resize image to safe Data URL and upload to Firebase Storage
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setProcessing(true);

    // Attempt direct Firebase Storage upload
    try {
      const storageUrl = await uploadFileToStorage(file, 'products');
      if (storageUrl) {
        onChange(storageUrl);
        setUrlInput(storageUrl);
        setProcessing(false);
        return;
      }
    } catch (storageErr) {
      console.warn('Firebase Storage direct upload skipped, compressing locally:', storageErr);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressedDataUrl);
          setUrlInput(compressedDataUrl);
        }
        setProcessing(false);
      };
      img.onerror = () => {
        setProcessing(false);
        alert('Could not process this image. Please try another file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleSelectPreset = (url: string) => {
    onChange(url);
    setUrlInput(url);
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
          Product Photo / Image
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
          >
            <X className="h-3 w-3" />
            <span>Remove Photo</span>
          </button>
        )}
      </div>

      {/* Preview Box if image exists */}
      {imageUrl ? (
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
          <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300/80 dark:border-slate-600 shadow-xs">
            <img
              src={imageUrl}
              alt={productName || 'Product Preview'}
              className="h-full w-full object-cover"
              onError={(e) => {
                // If link fails, show fallback icon
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {productName || 'Active Product Photo'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Image attached & ready for POS & Invoices.
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center gap-1"
              >
                <Camera className="h-3 w-3" />
                <span>Change Photo</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300 text-[11px] font-semibold hover:bg-rose-100 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Image Selection & Upload Area */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-3 space-y-3">
          {/* Sub tabs: Upload, Presets, URL */}
          <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Presets</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Link className="h-3.5 w-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                <Camera className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {processing ? 'Optimizing photo...' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG, WEBP (auto-compressed for instant offline speed)
              </p>
            </div>
          )}

          {/* TAB 2: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Pick a professional retail photo template matching your category:
              </p>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_TEMPLATES.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectPreset(item.url)}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left transition aspect-square"
                    title={`${item.name} (${item.category})`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex items-end">
                      <span className="text-[9px] font-bold text-white leading-tight line-clamp-1">
                        {item.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: IMAGE LINK */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Apply
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Paste any direct web link to an image file.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
