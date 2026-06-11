import React, { useState, useEffect } from 'react';
import api from '../api/api';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    site_name: '',
    tagline: '',
    hero_title: '',
    hero_subtitle: '',
    about_text: '',
    footer_text: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h2>Site Settings (CMS)</h2>
      
      <div className="login-card" style={{ maxWidth: '100%', padding: '2rem', textAlign: 'left' }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Site Name</label>
            <input type="text" name="site_name" className="form-control" value={settings.site_name || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Tagline</label>
            <input type="text" name="tagline" className="form-control" value={settings.tagline || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Home Hero Title</label>
            <input type="text" name="hero_title" className="form-control" value={settings.hero_title || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Home Hero Subtitle</label>
            <input type="text" name="hero_subtitle" className="form-control" value={settings.hero_subtitle || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>About Page Text</label>
            <textarea name="about_text" className="form-control" rows={5} value={settings.about_text || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Footer Text</label>
            <input type="text" name="footer_text" className="form-control" value={settings.footer_text || ''} onChange={handleChange} />
          </div>
          
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
