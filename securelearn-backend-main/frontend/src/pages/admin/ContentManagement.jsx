import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UploadCloud, Link as LinkIcon, FileText, Video, Trash2, BookOpen } from 'lucide-react';

const ContentManagement = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('FILE'); // FILE or LINK
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchContents = async () => {
    try {
      const response = await api.get('/api/admin/manage-content');
      setContents(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch hosted contents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadContent = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess(false);
    setUploadProgress(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      if (mode === 'LINK') {
        if (!videoUrl) {
          throw new Error('Please enter a valid video link.');
        }
        formData.append('videoUrl', videoUrl);
      } else {
        if (!selectedFile) {
          throw new Error('Please select a PDF or Video file to upload.');
        }
        formData.append('file', selectedFile);
      }

      await api.post('/api/admin/content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadSuccess(true);
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setSelectedFile(null);
      
      // Reset file input element manually
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput) fileInput.value = '';

      fetchContents();
    } catch (err) {
      setUploadError(err.message || err.response?.data || 'Failed to upload content.');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeleteContent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content? The physical file will be removed from disk.')) return;
    try {
      await api.delete(`/api/admin/manage-content/${id}`);
      fetchContents();
    } catch (err) {
      alert('Failed to delete content.');
    }
  };

  return (
    <div className="content-container">
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem' }}>Learning Material Manager</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr 1.5fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Upload Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <UploadCloud size={20} color="var(--primary)" /> Upload Content
          </h2>

          {uploadError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Content uploaded and published successfully!
            </div>
          )}

          <form onSubmit={handleUploadContent}>
            <div className="form-group">
              <label className="form-label">Material Title</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Introduction to Physics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Summary</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Brief summary of what this document/video covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Publish Mode</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setMode('FILE')}
                  className={`btn ${mode === 'FILE' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem' }}
                >
                  <FileText size={16} /> File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setMode('LINK')}
                  className={`btn ${mode === 'LINK' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem' }}
                >
                  <LinkIcon size={16} /> Video Link
                </button>
              </div>
            </div>

            {mode === 'LINK' ? (
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">External Video Link (YouTube/Mighty Networks)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Select File (PDF or MP4 Video)</label>
                <input
                  id="file-upload-input"
                  type="file"
                  accept="application/pdf,video/mp4"
                  className="form-input"
                  onChange={handleFileChange}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
                  Max file size: 100MB
                </span>
              </div>
            )}

            <button type="submit" disabled={uploadProgress} className="btn btn-primary" style={{ width: '100%' }}>
              {uploadProgress ? 'Uploading (Please wait)...' : 'Publish Content'}
            </button>
          </form>
        </div>

        {/* Contents List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="var(--primary)" /> Published Assets
          </h2>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--primary)' }}>Loading assets...</div>
          ) : contents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No learning assets have been uploaded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contents.map((item) => (
                <div key={item.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{item.description || 'No description'}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span className={`badge ${item.contentType === 'VIDEO' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                        {item.contentType}
                      </span>
                      {item.type && (
                        <span className="badge badge-secondary" style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteContent(item.id)} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '10px' }} title="Delete published content">
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;
