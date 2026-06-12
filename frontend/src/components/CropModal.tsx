import React, { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import type { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface CropModalProps {
  imageSrc: string;
  onCrop: (file: File) => void;
  onCancel: () => void;
  aspectRatio?: number; // e.g. 16/9
}

const CropModal: React.FC<CropModalProps> = ({ imageSrc, onCrop, onCancel, aspectRatio }) => {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCrop = () => {
    setIsProcessing(true);
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.getCroppedCanvas({
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      }).toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' });
          onCrop(file);
        } else {
          setIsProcessing(false);
        }
      }, 'image/jpeg', 1.0); // 1.0 represents 100% maximum quality, zero compression loss
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', maxHeight: '95vh', overflow: 'hidden' }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>Crop Your Image</h3>
        <div style={{ flex: 1, minHeight: 0, height: '60vh', width: '100%', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <Cropper
            src={imageSrc}
            style={{ height: '100%', width: '100%' }}
            initialAspectRatio={aspectRatio || NaN}
            aspectRatio={aspectRatio || NaN}
            guides={true}
            ref={cropperRef}
            viewMode={2} // viewMode 2 ensures crop box fits within canvas seamlessly
            background={false}
            autoCropArea={1}
            checkOrientation={false}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onCancel} style={{ backgroundColor: '#ccc', color: '#333' }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCrop} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;
