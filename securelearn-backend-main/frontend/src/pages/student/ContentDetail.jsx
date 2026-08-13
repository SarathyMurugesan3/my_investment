import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Play, FileText, Download, ShieldAlert, ExternalLink } from 'lucide-react';

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signedUrl, setSignedUrl] = useState('');
  const [videoSrc, setVideoSrc] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.get('/api/student/content');
        const found = response.data.find(c => c.id === id);
        if (!found) {
          setError('Content not found.');
          setLoading(false);
          return;
        }
        setItem(found);

        // Fetch type-specific URLs
        if (found.contentType === 'PDF') {
          // Fetch signed PDF URL
          const pdfUrlRes = await api.get(`/api/student/pdf/url/${id}`);
          // Replace domain if pointing to dynamic render instances, ensuring it targets API base
          const localUrl = pdfUrlRes.data.replace('https://securelearn-backend.onrender.com', 'http://localhost:8080');
          setSignedUrl(localUrl);
        } else if (found.contentType === 'VIDEO') {
          if (found.type === 'VIDEO_URL') {
            const secureUrlRes = await api.get(`/api/student/video/${id}/secure-url`);
            setVideoSrc(secureUrlRes.data);
          } else {
            // HLS stream token request
            const tokenRes = await api.get(`/api/student/video/token/${id}`);
            const token = tokenRes.data;
            const hlsUrl = `http://localhost:8080/api/student/video/${id}/playlist?token=${token}`;
            setVideoSrc(hlsUrl);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load content details.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '80vh', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
        <h3>Loading Content...</h3>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="content-container">
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger)' }}>
          {error || 'Content not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1.5fr 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Main Player/Viewer */}
        <div className="glass-panel" style={{ padding: '2rem', flexGrow: 2 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{item.title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{item.description || 'No description provided.'}</p>

          {item.contentType === 'VIDEO' ? (
            <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', border: '1px solid var(--border-color)' }}>
              {item.type === 'VIDEO_URL' ? (
                // If it is a Mighty Networks / Youtube Style external URL
                videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be') ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={videoSrc.replace('watch?v=', 'embed/')}
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  // Simple iframe or generic link
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Play size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '1rem' }}>External Video Stream</h3>
                    <a href={videoSrc} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Open Video Link <ExternalLink size={16} />
                    </a>
                  </div>
                )
              ) : (
                // HLS Playlist Video Player
                <video
                  src={videoSrc}
                  controls
                  style={{ width: '100%', height: '100%' }}
                  poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
                >
                  Your browser does not support HLS playback natively. Please use a browser that supports HLS or download the player.
                </video>
              )}
            </div>
          ) : (
            // PDF Material
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '3rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)', marginBottom: '1.5rem' }}>
                <FileText size={48} color="var(--warning)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Secure Document</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem auto', fontSize: '0.9rem' }}>
                This is a secure proctored document. It contains custom watermarks with your email (<strong>{user?.email}</strong>) and IP trace codes to prevent unauthorized sharing.
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {signedUrl && (
                  <>
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      View Secure PDF <ExternalLink size={16} />
                    </a>
                    <a href={signedUrl.replace('inline', 'attachment')} download className="btn btn-secondary">
                      <Download size={16} /> Download
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security / Proctoring Rules Card */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--danger)' }}>
            <ShieldAlert size={20} />
            <h3 style={{ fontSize: '1.15rem' }}>Proctoring Notice</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
            To safeguard the intellectual property of this learning platform:
          </p>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1rem' }}>
            <li>Every document is dynamically embedded with watermarks containing your email address and tracking footprint.</li>
            <li>Sharing, distributing, or taking screenshots of these pages logs activity entries on the Admin panel.</li>
            <li>Your account risk score is updated in real-time. If it surpasses 50%, access to learning materials will be automatically suspended.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
