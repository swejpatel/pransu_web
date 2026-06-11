import React, { useState, useEffect } from 'react';
import api from '../api/api';
import CropModal from '../components/CropModal';

interface Photo {
  id: number;
  filename: string;
  title: string;
  is_hero: number;
  is_gallery: number;
  category_name?: string;
}

const AdminPhotos: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isGallery, setIsGallery] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPhotos();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await api.get('/photos/admin/all');
      setPhotos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        setOriginalImageSrc(src);
        setCropImageSrc(src);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRecrop = () => {
    if (originalImageSrc) {
      setCropImageSrc(originalImageSrc);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    let finalCategoryId = categoryId;
    
    // If they typed a new album name, create it first
    if (categoryId === 'new' && newCategoryName) {
      try {
        const catRes = await api.post('/categories', { name: newCategoryName });
        finalCategoryId = catRes.data.id.toString();
        fetchCategories(); // refresh list
      } catch (err) {
        alert('Failed to create new album');
        return;
      }
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('title', title);
    if (finalCategoryId && finalCategoryId !== 'new') {
      formData.append('category_id', finalCategoryId);
    }
    formData.append('description', description);
    formData.append('is_featured', isFeatured ? 'true' : 'false');
    formData.append('is_gallery', isGallery ? 'true' : 'false');

    try {
      await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      setPreviewSrc(null);
      setOriginalImageSrc(null);
      setTitle('');
      setCategoryId('');
      setNewCategoryName('');
      setDescription('');
      setIsFeatured(false);
      setIsGallery(true);
      fetchPhotos();
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this photo permanently from the database?')) return;
    try {
      await api.delete(`/photos/${id}`);
      fetchPhotos(); // Refresh table
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlbum = async (id: number) => {
    if (!window.confirm('WARNING: This will permanently delete the album AND drop all photos inside it from the database. Are you absolutely sure?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      fetchPhotos(); // Refresh photos since album's photos were dropped
    } catch (err) {
      console.error(err);
      alert('Failed to delete album.');
    }
  };

  const moveAlbum = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= categories.length) return;
    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[index + direction];
    newCats[index + direction] = temp;
    
    setCategories(newCats); // Optimistic UI update
    const updates = newCats.map((c, i) => ({ id: c.id, sort_order: i }));
    try {
      await api.put('/categories/reorder', updates);
    } catch (err) {
      console.error(err);
      fetchCategories(); // Revert on failure
    }
  };

  const movePhoto = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= filteredPhotos.length) return;
    const newFiltered = [...filteredPhotos];
    const temp = newFiltered[index];
    newFiltered[index] = newFiltered[index + direction];
    newFiltered[index + direction] = temp;
    
    // Optimistic UI for filtered list
    // We cannot easily update the main `photos` state without complex mapping, 
    // but we can just map and send the updates, then fetch.
    const updates = newFiltered.map((p, i) => ({ id: p.id, sort_order: i }));
    try {
      await api.put('/photos/reorder', updates);
      fetchPhotos(); // Always fetch to get the true new global state
    } catch (err) {
      console.error(err);
    }
  };

  // Filter photos based on search query (matches title or category/album)
  const filteredPhotos = photos.filter(p => 
    (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <h2>Photo Manager</h2>
      
      <div className="login-card" style={{ maxWidth: '100%', marginBottom: '2rem', padding: '2rem', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '1rem' }}>Upload New Photo</h3>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Photo File</label>
            <input type="file" className="form-control" onChange={handleFileSelect} accept="image/*" />
            
            {previewSrc && (
              <div style={{ marginTop: '1rem', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '4px', backgroundColor: '#fff' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Cropped Preview:</p>
                <img src={previewSrc} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', display: 'block', marginBottom: '1rem' }} />
                <button type="button" className="btn btn-secondary" onClick={handleRecrop} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                  Adjust Crop
                </button>
              </div>
            )}
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <label>Assign to Album</label>
              <select className="form-control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">-- No Album --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="new" style={{ fontWeight: 'bold', color: 'var(--text-accent)' }}>+ Create New Album</option>
              </select>
            </div>
            {categoryId === 'new' && (
              <div style={{ flex: 1 }}>
                <label>New Album Name</label>
                <input type="text" className="form-control" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Wedded Bliss" required />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Caption / Title (Optional)</label>
            <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          
          <div className="form-group" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'none' }}>
              <input type="checkbox" checked={isGallery} onChange={(e) => setIsGallery(e.target.checked)} />
              Show in Gallery Albums
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'none' }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Pin to Home Page "Featured Works" Scroll
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={!file}>Upload Photo</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Album Manager Section */}
        <div className="login-card" style={{ flex: 1, minWidth: '300px', marginBottom: '2rem', padding: '2rem', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--text-accent)', paddingBottom: '0.5rem' }}>Album Manager</h3>
          {categories.length === 0 ? <p>No albums created yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {categories.map((c, index) => (
                <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span 
                    style={{ fontWeight: '500', cursor: 'pointer', color: searchQuery === c.name ? 'var(--text-accent)' : 'inherit', transition: 'color 0.2s ease' }} 
                    onClick={() => setSearchQuery(searchQuery === c.name ? '' : c.name)}
                    title="Click to view only this album's photos"
                  >
                    {c.name}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-small" onClick={() => moveAlbum(index, -1)} disabled={index === 0} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>↑</button>
                    <button className="btn btn-small" onClick={() => moveAlbum(index, 1)} disabled={index === categories.length - 1} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>↓</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDeleteAlbum(c.id)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', marginLeft: '0.5rem' }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Photo Table Section */}
        <div style={{ flex: 3, minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>All Uploaded Photos</h3>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by title or album..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '300px', marginBottom: 0 }}
            />
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Album</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPhotos.map((photo, index) => (
                <tr key={photo.id}>
                  <td><img src={photo.filename.startsWith('http') ? photo.filename : `/uploads/${photo.filename}`} alt={photo.title} style={{ objectFit: 'cover' }} /></td>
                  <td>{photo.title || 'Untitled'}</td>
                  <td>{photo.category_name || 'Unassigned'}</td>
                  <td>
                    <div className="action-btns" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-small" onClick={() => movePhoto(index, -1)} disabled={index === 0} style={{ padding: '0.2rem 0.5rem' }} title="Move Up">↑</button>
                      <button className="btn btn-small" onClick={() => movePhoto(index, 1)} disabled={index === filteredPhotos.length - 1} style={{ padding: '0.2rem 0.5rem' }} title="Move Down">↓</button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(photo.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPhotos.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No photos found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {cropImageSrc && (
        <CropModal
          imageSrc={cropImageSrc}
          onCrop={(croppedFile) => {
            setFile(croppedFile);
            setPreviewSrc(URL.createObjectURL(croppedFile));
            setCropImageSrc(null);
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
};

export default AdminPhotos;
