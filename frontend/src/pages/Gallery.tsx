import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Photo {
  id: number;
  filename: string;
  title: string;
  category_name: string;
}

const AlbumCoverSlider: React.FC<{ photos: Photo[], catName: string, isMyTurn: boolean }> = ({ photos, catName, isMyTurn }) => {
  const [idx, setIdx] = useState(0);
  
  useEffect(() => {
    if (isMyTurn && photos.length > 1) {
      setIdx(prev => (prev + 1) % photos.length);
    }
  }, [isMyTurn, photos.length]);

  if (!photos.length) {
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-secondary)' }}>No Photos</span>
      </div>
    );
  }

  return (
    <>
      {photos.slice(0, 5).map((p, i) => (
        <img 
          key={p.id}
          src={p.filename.startsWith('http') ? p.filename : `/uploads/${p.filename}`} 
          alt={catName}
          className="album-img"
          style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === idx ? 1 : 0, 
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            zIndex: i === idx ? 2 : 1
          }} 
        />
      ))}
    </>
  );
};

const Gallery: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(categorySlug || 'all');
  const [globalTick, setGlobalTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalTick(prev => prev + 1);
    }, 2500); // Exactly ONE album slides every 2.5 seconds, ensuring max 1 changing at a time
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchCategory = categorySlug || 'all';
    setActiveCategory(fetchCategory);
    fetchPhotos(fetchCategory);
  }, [categorySlug]);

  const fetchPhotos = (category: string) => {
    api.get(`/photos?type=gallery&category=${category}`).then((res) => {
      setPhotos(res.data);
    }).catch(console.error);
  };

  const handleCategoryClick = (slug: string) => {
    if (slug === 'all') navigate('/gallery');
    else navigate(`/gallery/${slug}`);
  };

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>
      <section className="gallery-section">
        {categorySlug ? (
          <>
            <h2 className="section-title" style={{ textTransform: 'uppercase' }}>
              {categories.find(c => c.slug === categorySlug)?.name || categorySlug}
            </h2>
            <div className="masonry-grid container">
              {photos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className={`gallery-item ${index % 3 === 0 ? 'portrait' : index % 5 === 0 ? 'landscape' : ''}`}
                >
                  <img src={photo.filename.startsWith('http') ? photo.filename : `/uploads/${photo.filename}`} alt={photo.title || 'Gallery item'} className="gallery-img" />
                  <div className="gallery-overlay">
                    <h3 className="gallery-title">{photo.title || photo.category_name}</h3>
                  </div>
                </div>
              ))}
            </div>
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
              <button className="btn" onClick={() => navigate('/gallery')}>← Back to All Albums</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="section-title" style={{ fontSize: '4rem', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '5rem' }}>Portfolios</h2>
            <style>
              {`
                .album-card:hover .album-img { transform: scale(1.05) !important; }
                .album-card:hover .album-overlay { background: rgba(0,0,0,0.4) !important; }
                .album-card:hover .album-line { width: 80px !important; }
              `}
            </style>
            <div className="albums-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '3rem', padding: '0 4rem' }}>
              {categories.map((cat, index) => {
                // Get all photos for this category to use in the slider
                const albumPhotos = photos.filter(p => p.category_name === cat.name);
                const isMyTurn = (globalTick % categories.length) === index;
                return (
                  <div 
                    key={cat.id} 
                    style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', borderRadius: '4px', aspectRatio: '16/9' }}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="album-card"
                  >
                    <AlbumCoverSlider photos={albumPhotos} catName={cat.name} isMyTurn={isMyTurn} />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.2)', transition: 'background 0.5s ease', zIndex: 10 }} className="album-overlay">
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%' }}>
                        <h3 style={{ color: 'white', fontSize: '2.5rem', letterSpacing: '6px', textTransform: 'uppercase', margin: 0, textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{cat.name}</h3>
                        <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--text-accent)', margin: '1rem auto 0', transition: 'width 0.3s ease' }} className="album-line"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Gallery;
