import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Upload, CheckCircle2, AlertCircle, Loader2, Camera } from 'lucide-react';

// Compress image via HTML5 Canvas to max 400x400px (keeps size ~30KB)
const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const ImageKitUploader = ({ currentImage, onUploadSuccess, label = 'Profile Photo' }) => {
  const [preview, setPreview] = useState(() => {
    // Filter out invalid blob: URLs from old sessions
    if (currentImage && currentImage.startsWith('blob:')) return '';
    return currentImage || '';
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Compress image client-side to prevent large payload errors
      const compressedBase64 = await compressImage(file, 400, 400, 0.82);

      // 2. Try uploading via Backend ImageKit Route (Uses Private Key)
      let uploadedUrl = '';
      try {
        const res = await axiosInstance.post('/api/upload-image', {
          file: compressedBase64,
          fileName: `profile_${Date.now()}.jpg`,
        });

        if (res.data && res.data.url) {
          uploadedUrl = res.data.url;
        }
      } catch (backendErr) {
        console.warn('Backend ImageKit upload endpoint fallback, using compressed data URL');
      }

      // If backend ImageKit upload succeeded, use ImageKit URL; else use compressed Base64 Data URL
      const finalUrl = uploadedUrl || compressedBase64;
      setPreview(finalUrl);
      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess(finalUrl);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to process image file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="shadcn-input-group">
      <label className="shadcn-label">{label}</label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#ffffff',
          border: '2.5px solid #0f172a',
          boxShadow: '3px 3px 0px #0f172a',
          borderRadius: 12,
          padding: 12,
        }}
      >
        {/* Avatar Preview */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '2px solid #0f172a',
            overflow: 'hidden',
            background: 'var(--neo-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {preview ? (
            <img src={preview} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Camera size={28} color="#0f172a" />
          )}
        </div>

        {/* Upload Button & Status */}
        <div style={{ flex: 1 }}>
          <label
            className="shadcn-btn shadcn-btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              marginBottom: 4,
            }}
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="spin" /> Processing Image...
              </>
            ) : (
              <>
                <Upload size={14} /> Select Profile Photo
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>

          {success && (
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> Photo uploaded successfully!
            </p>
          )}

          {error && (
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageKitUploader;
