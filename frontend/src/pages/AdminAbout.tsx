import React, { useState, useEffect } from 'react';
import api from '../api/api';
import CropModal from '../components/CropModal';

interface AboutConfig {
  title: string;
  text1: string;
  text2: string;
  image: string;
  instagram: string;
  twitter: string;
  facebook: string;
}

const AdminAbout: React.FC = () => {
  const [config, setConfig] = useState<AboutConfig>({
    title: 'The Visionary Behind the Lens',
    text1: 'With over a decade of experience, we specialize in capturing the raw, authentic moments that define our human experience. From the towering peaks of the Himalayas to the subtle expressions of a portrait, our goal is to tell stories that resonate.',
    text2: 'Every photograph is a testament to the beauty of the world and the intricate details that often go unnoticed. Through a unique blend of technical expertise and artistic intuition, we aim to evoke emotion and inspire a deeper connection with the visual narrative.',
    image: '/placeholder-about.jpg',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com'
  });
  const [loading, setLoading] = useState(false);
  const [activeCropSrc, setActiveCropSrc] = useState<string | null>(null);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.about_page_json) {
        setConfig(JSON.parse(res.data.about_page_json));
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', { about_page_json: JSON.stringify(config) });
      alert('About Page configuration saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    }
    setLoading(false);
  };

  const updateField = (field: keyof AboutConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setActiveCropSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('title', 'About Page Image');

    try {
      const res = await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filename = res.data.filename;
      updateField('image', `/uploads/${filename}`);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>About Page Manager</h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="login-card" style={{ maxWidth: '100%', marginBottom: '2rem', padding: '2rem', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--text-accent)', paddingBottom: '0.5rem' }}>Text Content</h3>
        <div className="form-group">
          <label>Headline Title</label>
          <input type="text" className="form-control" value={config.title} onChange={(e) => updateField('title', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Paragraph 1</label>
          <textarea className="form-control" rows={4} value={config.text1} onChange={(e) => updateField('text1', e.target.value)}></textarea>
        </div>
        <div className="form-group">
          <label>Paragraph 2</label>
          <textarea className="form-control" rows={4} value={config.text2} onChange={(e) => updateField('text2', e.target.value)}></textarea>
        </div>
      </div>

      <div className="login-card" style={{ maxWidth: '100%', marginBottom: '2rem', padding: '2rem', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--text-accent)', paddingBottom: '0.5rem' }}>Profile Image</h3>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <label>Upload New Profile Image</label>
            <input type="file" className="form-control" accept="image/*" onChange={handleFileSelect} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Image will be cropped to best fit the layout.</p>
          </div>
          <div style={{ flex: 1 }}>
            <label>Current Image Preview</label>
            {config.image && (
              <img src={config.image.startsWith('http') ? config.image : config.image} alt="About Profile" style={{ width: '100%', maxWidth: '300px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            )}
          </div>
        </div>
      </div>

      <div className="login-card" style={{ maxWidth: '100%', marginBottom: '2rem', padding: '2rem', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--text-accent)', paddingBottom: '0.5rem' }}>Social Media Links</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Leave empty to hide the icon.</p>
        <div className="form-group">
          <label>Instagram URL</label>
          <input type="text" className="form-control" value={config.instagram} onChange={(e) => updateField('instagram', e.target.value)} placeholder="https://instagram.com/yourhandle" />
        </div>
        <div className="form-group">
          <label>Twitter / X URL</label>
          <input type="text" className="form-control" value={config.twitter} onChange={(e) => updateField('twitter', e.target.value)} placeholder="https://twitter.com/yourhandle" />
        </div>
        <div className="form-group">
          <label>Facebook URL</label>
          <input type="text" className="form-control" value={config.facebook} onChange={(e) => updateField('facebook', e.target.value)} placeholder="https://facebook.com/yourhandle" />
        </div>
      </div>

      {activeCropSrc && (
        <CropModal
          imageSrc={activeCropSrc}
          onCrop={(file) => {
            handleFileUpload(file);
            setActiveCropSrc(null);
          }}
          onCancel={() => setActiveCropSrc(null)}
        />
      )}
    </div>
  );
};

export default AdminAbout;
