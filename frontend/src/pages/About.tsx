import React, { useState, useEffect } from 'react';
import api from '../api/api';

interface AboutConfig {
  title: string;
  text1: string;
  text2: string;
  image: string;
  instagram: string;
  twitter: string;
  facebook: string;
}

const About: React.FC = () => {
  const [config, setConfig] = useState<AboutConfig>({
    title: 'The Visionary Behind the Lens',
    text1: 'With over a decade of experience, we specialize in capturing the raw, authentic moments that define our human experience. From the towering peaks of the Himalayas to the subtle expressions of a portrait, our goal is to tell stories that resonate.',
    text2: 'Every photograph is a testament to the beauty of the world and the intricate details that often go unnoticed. Through a unique blend of technical expertise and artistic intuition, we aim to evoke emotion and inspire a deeper connection with the visual narrative.',
    image: '/placeholder-about.jpg',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com'
  });

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.about_page_json) {
        setConfig(JSON.parse(res.data.about_page_json));
      }
    }).catch(console.error);
  }, []);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 2rem)' }}>
      <div className="container">
        <div className="about-content-wrapper">
          <div className="about-text">
            <h2>{config.title}</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{config.text1}</p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{config.text2}</p>
            
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Get in Touch</h3>
              {/* Social Media Icons */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
              {config.instagram && (
                <a href={config.instagram} target="_blank" rel="noreferrer" className="social-icon-link" aria-label="Instagram">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}
              {config.twitter && (
                <a href={config.twitter} target="_blank" rel="noreferrer" className="social-icon-link" aria-label="Twitter">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
              )}
              {config.facebook && (
                <a href={config.facebook} target="_blank" rel="noreferrer" className="social-icon-link" aria-label="Facebook">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              )}
              </div>
            </div>
            <style>
              {`
                .social-icon-link {
                  color: var(--text-primary);
                  transition: color 0.3s ease, transform 0.3s ease;
                  display: inline-block;
                }
                .social-icon-link:hover {
                  color: var(--text-accent);
                  transform: translateY(-3px);
                }
              `}
            </style>
          </div>
          <div className="about-image">
            <img src={config.image.startsWith('http') ? config.image : config.image} alt="About Profile" style={{ width: '100%', height: 'auto', borderRadius: '4px', filter: 'grayscale(15%)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
