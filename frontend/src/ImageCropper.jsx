import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

const createImage = (url) => new Promise((resolve, reject) => {
  const image = new Image()
  image.addEventListener('load', () => resolve(image))
  image.addEventListener('error', (error) => reject(error))
  image.setAttribute('crossOrigin', 'anonymous')
  image.src = url
})

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null;

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

export function ImageCropper({ image, aspect, onCropDone, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleDone = async () => {
    try {
        const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
        onCropDone(croppedBlob)
    } catch(e) {
        console.error(e)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-panel" style={{ width: '800px', height: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(0,0,0,0.5)', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Resmi Kırp</h3>
            <button className="modal-close" style={{ position:'static' }} onClick={onCancel}><X size={20} /></button>
        </div>
        <div style={{ position: 'relative', flex: 1, background: '#0f1118' }}>
            <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
            />
        </div>
        <div style={{ padding: '24px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yakınlaştırma:</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} style={{ width: '150px' }}/>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn" onClick={onCancel}>İptal</button>
                <button className="btn btn-primary" onClick={handleDone}><Check size={18} /> Kırp ve Onayla</button>
            </div>
        </div>
      </div>
    </div>
  )
}
