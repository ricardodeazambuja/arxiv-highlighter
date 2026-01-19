import { useState, useEffect } from 'preact/hooks';
import { useURLState, type Annotation } from './hooks/useURLState';
import { PDFViewer } from './components/PDFViewer';
import { AnnotationLayer } from './components/AnnotationLayer';
import { Toolbar } from './components/Toolbar';
import { HelpModal } from './components/HelpModal';
import { RECTCOLOURS_KEYS } from './utils/constants';

// Check if URL hash has a pdf url on initial load (before useEffect runs)
const hasUrlInHash = () => {
  const hash = window.location.hash.substring(1);
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  return !!params.get('url');
};

// Extract ArXiv paper ID from URL for fallback title
const extractArxivId = (url: string): string | null => {
  // Match patterns like arxiv.org/pdf/2103.04423 or arxiv.org/abs/2103.04423
  const match = url.match(/arxiv\.org\/(?:pdf|abs)\/(\d{4}\.\d{4,5}(?:v\d+)?)/i);
  return match ? match[1] : null;
};

export function App() {
  const { state, setUrl, setPage, setAlpha, addAnnotation, updateAnnotation, deleteAnnotation } = useURLState();
  const [totalPages, setTotalPages] = useState(0);
  const [viewport, setViewport] = useState<any>(null);
  const [currentColorIdx, setCurrentColorIdx] = useState(0);
  const [isLanding, setIsLanding] = useState(!hasUrlInHash());
  const [tempUrl, setTempUrl] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');

  // When state.url changes (e.g., from hash parsing), exit landing page
  useEffect(() => {
    if (state.url) {
      setIsLanding(false);
    }
  }, [state.url]);

  // Clear viewport when page changes so annotations don't show until page renders
  useEffect(() => {
    setViewport(null);
  }, [state.page]);

  const currentColor = RECTCOLOURS_KEYS[currentColorIdx];

  const handleAddAnnotation = (ann: Annotation) => {
    addAnnotation(ann);
  };

  const handleUpdateAnnotation = (index: number, note: string) => {
    updateAnnotation(index, note);
  };

  const handleDeleteAnnotation = (index: number) => {
    deleteAnnotation(index);
  };

  const handleUrlSubmit = (e: any) => {
    e.preventDefault();
    if (tempUrl) {
      setUrl(tempUrl);
      setPage(1);
      // Clear annotations when a new URL is submitted
      // This is handled by the useURLState hook when setUrl is called with a new URL
      // For explicit clearing, one might call setAnnotations([]) if such a function existed.
      // For now, relying on the default behavior of useURLState.
      setIsLanding(false);
    }
  };

  const handleColorChange = (color: string) => {
    const idx = RECTCOLOURS_KEYS.indexOf(color);
    if (idx !== -1) setCurrentColorIdx(idx);
  };

  if (isLanding) {
    return (
      <div className="pdf-viewer-wrapper" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        <div className="premium-card" style={{ padding: '3rem', maxWidth: '600px', textAlign: 'center', margin: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ArXiv Highlighter
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Annotate and share research papers with a single URL. No server, no accounts, just pure collaboration.
          </p>
          <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Paste ArXiv or PDF URL..."
              value={tempUrl}
              onInput={(e) => setTempUrl((e.target as HTMLInputElement).value)}
              style={{ flex: 1, fontSize: '1rem' }}
            />
            <button type="submit">Start Highlighting</button>
          </form>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Example: <code>https://arxiv.org/pdf/2103.04423.pdf</code>
            </p>
            <button className="btn-help" onClick={() => setShowHelp(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Help
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-wrapper">
      <PDFViewer
        url={state.url}
        page={state.page}
        onLoad={setTotalPages}
        onRender={setViewport}
        onTitleLoad={setDocumentTitle}
      >
        {viewport && (
          <AnnotationLayer
            page={state.page}
            annotations={state.annotations}
            alpha={state.alpha}
            viewport={viewport}
            currentColor={currentColor}
            onAddAnnotation={handleAddAnnotation}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
          />
        )}
      </PDFViewer>

      <Toolbar
        currentColor={currentColor}
        onColorChange={handleColorChange}
        alpha={state.alpha}
        onAlphaChange={setAlpha}
      />

      <div className="controls premium-card">
        <button
          onClick={() => setPage(Math.max(1, state.page - 1))}
          disabled={state.page <= 1}
        >
          &larr; Prev
        </button>
        <span className="page-info">
          Page {state.page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, state.page + 1))}
          disabled={state.page >= totalPages}
        >
          Next &rarr;
        </button>
        <button
          className="btn-share"
          onClick={async () => {
            // Use document title, or fallback to ArXiv ID from URL
            const arxivId = extractArxivId(state.url);
            const displayTitle = documentTitle || (arxivId ? `ArXiv paper ${arxivId}` : null);

            const shareText = displayTitle
              ? `Check out my annotated PDF: "${displayTitle}"`
              : 'Check out my annotated PDF!';
            const shareData = {
              title: displayTitle || 'ArXiv Highlighter',
              text: shareText,
              url: window.location.href,
            };

            if (navigator.share) {
              try {
                await navigator.share(shareData);
              } catch (err) {
                // User cancelled or share failed
                console.log('Share cancelled or failed:', err);
              }
            } else {
              // Fallback: copy to clipboard
              await navigator.clipboard.writeText(window.location.href);
              alert('URL copied to clipboard!');
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Share
        </button>
        <button className="btn-help" onClick={() => setShowHelp(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Help
        </button>
        <button className="btn-danger" onClick={() => setIsLanding(true)}>
          Close
        </button>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
