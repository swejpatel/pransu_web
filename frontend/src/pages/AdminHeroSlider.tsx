import React, { useState, useEffect } from 'react';
import api from '../api/api';
import CropModal from '../components/CropModal';

interface HeroProject {
  title: string;
  url: string;
  images: string[]; // filenames, first is main, next 3 are thumbnails
}

const AdminHeroSlider: React.FC = () => {
  const [projects, setProjects] = useState<HeroProject[]>([
    { title: 'PROJECT 1', url: '/gallery', images: [] },
    { title: 'PROJECT 2', url: '/gallery', images: [] },
    { title: 'PROJECT 3', url: '/gallery', images: [] }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeCrop, setActiveCrop] = useState<{pIdx: number, imgIdx: number, src: string} | null>(null);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.hero_slider_json) {
        setProjects(JSON.parse(res.data.hero_slider_json));
      }
    });
  }, []);

  const handleFileSelect = (projectIndex: number, imageIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setActiveCrop({ pIdx: projectIndex, imgIdx: imageIndex, src: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', { hero_slider_json: JSON.stringify(projects) });
      alert('Hero Slider configuration saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    }
    setLoading(false);
  };

  const handleFileUpload = async (projectIndex: number, imageIndex: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('title', `Hero Project ${projectIndex + 1}`);
    formData.append('is_visible', 'false'); // Hide from general gallery

    try {
      const res = await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filename = res.data.filename;
      
      const newProjects = [...projects];
      if (!newProjects[projectIndex].images) newProjects[projectIndex].images = [];
      newProjects[projectIndex].images[imageIndex] = filename;
      setProjects(newProjects);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const removeImage = (projectIndex: number, imageIndex: number) => {
    const newProjects = [...projects];
    newProjects[projectIndex].images[imageIndex] = '';
    setProjects(newProjects);
  };

  const updateProjectText = (index: number, field: 'title' | 'url', value: string) => {
    const newProjects = [...projects];
    newProjects[index][field] = value;
    setProjects(newProjects);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Hero Slider Config (3 Projects x 4 Photos)</h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
      
      <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
        Configure the 3 main sliders for the Home Page. Each project requires 1 Main Image (16:9) and 3 Thumbnail images below it.
      </p>

      {projects.map((project, pIdx) => (
        <div key={pIdx} className="login-card" style={{ maxWidth: '100%', marginBottom: '2rem', padding: '2rem', textAlign: 'left' }}>
          <h3>Slider Group {pIdx + 1}</h3>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Title (Overlay Text)</label>
              <input type="text" className="form-control" value={project.title} onChange={(e) => updateProjectText(pIdx, 'title', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Link URL</label>
              <input type="text" className="form-control" value={project.url} onChange={(e) => updateProjectText(pIdx, 'url', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h4>Images (1 Main + 3 Thumbnails)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              {[0, 1, 2, 3].map((imgIdx) => (
                <div key={imgIdx} style={{ border: '1px dashed var(--border-color)', padding: '1rem', textAlign: 'center', borderRadius: '4px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
                    {imgIdx === 0 ? 'Main Image (16:9)' : `Thumbnail ${imgIdx}`}
                  </p>
                  
                  {project.images && project.images[imgIdx] ? (
                    <div>
                      <img src={project.images[imgIdx].startsWith('/') || project.images[imgIdx].startsWith('http') ? project.images[imgIdx] : `/uploads/${project.images[imgIdx]}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', marginBottom: '1rem' }} />
                      <button className="btn btn-small" onClick={() => removeImage(pIdx, imgIdx)}>Remove</button>
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ width: '100%', fontSize: '0.8rem' }}
                        onChange={(e) => handleFileSelect(pIdx, imgIdx, e)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {activeCrop && (
        <CropModal
          imageSrc={activeCrop.src}
          aspectRatio={activeCrop.imgIdx === 0 ? 16/9 : NaN} // Main image forced to 16:9, thumbnails free crop
          onCrop={(file) => {
            handleFileUpload(activeCrop.pIdx, activeCrop.imgIdx, file);
            setActiveCrop(null);
          }}
          onCancel={() => setActiveCrop(null)}
        />
      )}
    </div>
  );
};

export default AdminHeroSlider;
