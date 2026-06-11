import React, { useState, useEffect } from 'react';
import api from '../api/api';

interface Photo {
  id: number;
  filename: string;
  title: string;
  description: string;
}

interface HeroProject {
  title: string;
  url: string;
  images: string[];
}

const Home: React.FC = () => {
  const [projects, setProjects] = useState<HeroProject[]>([]);
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0); // 0 is main, 1-3 are thumbs
  const [featuredPhotos, setFeaturedPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    // Fetch Hero Slider Config from settings
    api.get('/settings').then((res) => {
      if (res.data.hero_slider_json) {
        setProjects(JSON.parse(res.data.hero_slider_json));
      }
    }).catch(console.error);

    // Fetch featured photos
    api.get('/photos?type=featured&limit=4').then((res) => {
      setFeaturedPhotos(res.data);
    }).catch(console.error);
  }, []);

  // Handle auto-sliding top-level projects AND thumbnails
  useEffect(() => {
    if (projects.length === 0) return;
    const interval = setInterval(() => {
      setActiveImageIdx((prevImgIdx) => {
        // If we are at the last thumbnail (index 3) or the project doesn't have 4 images
        const currentProjectImages = projects[activeProjectIdx]?.images || [];
        const nextImgIdx = prevImgIdx + 1;
        
        // Move to next project if we reach the end of the 4 thumbnails, OR if the next thumb doesn't exist
        if (nextImgIdx > 3 || !currentProjectImages[nextImgIdx]) {
          setActiveProjectIdx((prevProjIdx) => (prevProjIdx + 1) % projects.length);
          return 0; // reset to main image of the new project
        }
        
        // Otherwise, move to the next thumbnail in the current project
        return nextImgIdx;
      });
    }, 6000); // 6 seconds per photo to allow 10s Ken Burns animation to breathe
    return () => clearInterval(interval);
  }, [projects, activeProjectIdx]);

  const activeProject = projects[activeProjectIdx];
  const activeImage = activeProject?.images?.[activeImageIdx] || activeProject?.images?.[0]; // fallback to main if thumb is missing

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>
      {activeProject ? (
        <section className="hero-custom" style={{ width: '100%', height: 'calc(100vh - var(--nav-height))', display: 'flex', flexDirection: 'column' }}>
          {/* Main Hero Image (Fills majority of screen) */}
          <div style={{ position: 'relative', width: '100%', flex: 1, overflow: 'hidden', backgroundColor: '#000' }}>
            {/* Map all project images to utilize absolute CSS cross-fade & zoom animations */}
            {projects.map((proj, pIdx) => (
              proj.images?.map((img, iIdx) => {
                if (!img) return null;
                const isActive = activeProjectIdx === pIdx && activeImageIdx === iIdx;
                const imgSrc = img.startsWith('http') ? img : `/uploads/${img}`;
                return (
                  <div key={`${pIdx}-${iIdx}`} className={`hero-slide ${isActive ? 'active' : ''}`} style={{ transition: 'opacity 0.7s ease-in-out' }}>
                    <img src={imgSrc} alt={proj.title} className="hero-bg" style={{ transition: isActive ? 'transform 8s ease-out' : 'none' }} />
                  </div>
                );
              })
            ))}
            
            {projects.length === 0 && (
              <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#999' }}>Please add images in Admin</span>
              </div>
            )}
            
            <div className="hero-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)' }}></div>
            
            <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 10, animation: 'fadeUp 0.8s ease forwards' }}>
              <h2 key={`title-${activeProjectIdx}`} className="hero-custom-title" style={{ color: 'white', fontSize: '3rem', fontFamily: 'var(--font-display)', letterSpacing: '4px', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: 0, animation: 'fadeUp 0.5s ease forwards' }}>
                {activeProject.title}
              </h2>
              {activeProject.url && (
                <a href={activeProject.url} className="btn btn-primary hero-explore-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  Explore Album
                </a>
              )}
            </div>

            {/* Slider Dots for Projects */}
            <div style={{ position: 'absolute', bottom: '1.5rem', right: '2rem', display: 'flex', gap: '10px', zIndex: 10 }}>
              {projects.map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setActiveProjectIdx(idx); setActiveImageIdx(0); }}
                  style={{ 
                    width: '12px', height: '12px', borderRadius: '50%', cursor: 'pointer',
                    backgroundColor: activeProjectIdx === idx ? 'white' : 'rgba(255,255,255,0.4)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                  }} 
                />
              ))}
            </div>
          </div>

          {/* 3 Thumbnails Below (Fills remaining height) */}
          {activeProject.images && activeProject.images.length > 1 && (
            <div className="hero-thumbs-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '4px', height: '22vh' }}>
              {[1, 2, 3].map((thumbIdx) => (
                <div 
                  key={thumbIdx} 
                  onClick={() => setActiveImageIdx(thumbIdx)}
                  style={{ 
                    position: 'relative', overflow: 'hidden', cursor: 'pointer',
                    opacity: activeImageIdx === thumbIdx ? 1 : 0.6,
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => { if (activeImageIdx !== thumbIdx) e.currentTarget.style.opacity = '0.6' }}
                >
                  {activeProject.images[thumbIdx] ? (
                    <img src={activeProject.images[thumbIdx].startsWith('http') ? activeProject.images[thumbIdx] : `/uploads/${activeProject.images[thumbIdx]}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Empty</span>
                    </div>
                  )}
                  {activeImageIdx === thumbIdx && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', backgroundColor: 'var(--text-accent)' }}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Please configure the Hero Slider in the Admin CMS.</p>
        </section>
      )}

      {/* Featured Scrolling Gallery */}
      {featuredPhotos.length > 0 && (
        <section className="featured-section" style={{ padding: '6rem 0', backgroundColor: 'var(--bg-primary)' }}>
          <div className="container">
            <h2 className="section-title" style={{ marginBottom: '3rem', fontSize: '2.5rem' }}>Featured Works</h2>
            <div className="featured-scroller" style={{ 
              display: 'flex', 
              gap: '2rem', 
              overflowX: 'auto', 
              paddingBottom: '2rem',
              scrollSnapType: 'x mandatory' 
            }}>
              {featuredPhotos.map(photo => (
                <div key={photo.id} className="featured-item" style={{ 
                  flex: '0 0 calc(25% - 1.5rem)', 
                  minWidth: '280px',
                  scrollSnapAlign: 'start',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '4px',
                  aspectRatio: '16/9'
                }}>
                <img 
                  src={photo.filename.startsWith('http') ? photo.filename : `/uploads/${photo.filename}`} 
                  alt={photo.title || 'Featured photo'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  className="featured-img"
                />
                  <div className="gallery-overlay">
                    <h3 className="gallery-title">{photo.title || 'Featured'}</h3>
                  </div>
                </div>
              ))}
            </div>
            <style>
              {`
                .featured-item:hover .featured-img { transform: scale(1.05); }
                .featured-item:hover .gallery-overlay { opacity: 1; }
                .featured-scroller::-webkit-scrollbar { height: 8px; }
                .featured-scroller::-webkit-scrollbar-track { background: var(--bg-secondary); }
                .featured-scroller::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
                .featured-scroller::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }

                @media (max-width: 768px) {
                  .featured-scroller {
                    flex-direction: column !important;
                    overflow-x: hidden !important;
                    padding-bottom: 0 !important;
                  }
                  .featured-item {
                    flex: none !important;
                    width: 100% !important;
                    min-width: 100% !important;
                    aspect-ratio: auto !important;
                  }
                  .featured-item .featured-img {
                    height: 400px !important;
                  }
                }
              `}
            </style>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
