import { useEffect, useRef, useState } from 'preact/hooks';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFCache } from '../utils/PDFCache';

// Use the local worker with dynamic base path
pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string;
    page: number;
    onLoad: (totalPages: number) => void;
    onRender: (viewport: any) => void;
    onTitleLoad?: (title: string) => void;
    children?: any;
}

export function PDFViewer({ url, page, onLoad, onRender, onTitleLoad, children }: PDFViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [loading, setLoading] = useState(false);
    const [rendering, setRendering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Zoom and pan state for pinch-to-zoom and drag
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [pinchStartDistance, setPinchStartDistance] = useState<number | null>(null);
    const [pinchStartZoom, setPinchStartZoom] = useState(1);
    const [lastMidpoint, setLastMidpoint] = useState<{ x: number, y: number } | null>(null);

    // Pinch gesture handlers
    const getPinchDistance = (touches: TouchList) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getMidpoint = (touches: TouchList) => ({
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
    });

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault(); // Always prevent browser zoom
            const distance = getPinchDistance(e.touches);
            setPinchStartDistance(distance);
            setPinchStartZoom(zoom);
            setLastMidpoint(getMidpoint(e.touches));
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2 && pinchStartDistance !== null) {
            e.preventDefault(); // Always prevent browser zoom

            const currentDistance = getPinchDistance(e.touches);
            const currentMidpoint = getMidpoint(e.touches);

            // Apply zoom based on pinch distance change
            const scale = currentDistance / pinchStartDistance;
            const newZoom = Math.min(Math.max(pinchStartZoom * scale, 0.5), 4);
            setZoom(newZoom);

            // Apply pan/drag based on midpoint movement
            if (lastMidpoint) {
                const dx = currentMidpoint.x - lastMidpoint.x;
                const dy = currentMidpoint.y - lastMidpoint.y;
                setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            }
            setLastMidpoint(currentMidpoint);
        }
    };

    const handleTouchEnd = () => {
        setPinchStartDistance(null);
        setLastMidpoint(null);
    };

    useEffect(() => {
        if (!url) return;

        setLoading(true);
        setError(null);

        const loadPDF = async () => {
            // Handle ArXiv CORS:
            // ArXiv allows "Simple Requests" (standard GET) with Access-Control-Allow-Origin: *
            // But it BLOCKS "Preflighted Requests" (OPTIONS requests).
            // PDF.js by default uses Range headers for chunked downloads, which triggers preflight.
            // Fix: Disable range/stream requests to keep it as a "Simple Request".
            let finalUrl = url;
            const isArxiv = url.toLowerCase().includes('arxiv.org');

            if (isArxiv) {
                // Remove trailing .pdf if present (ArXiv CORS works on /pdf/ID without extension)
                let cleanUrl = url.replace(/\.pdf$/i, '');
                // Convert /abs/ to /pdf/ if present
                cleanUrl = cleanUrl.replace(/\/abs\//i, '/pdf/');
                finalUrl = cleanUrl;
                console.log('[PDFViewer] Using direct ArXiv CORS endpoint:', finalUrl);
            }

            try {
                // Check cache first
                const cachedData = await PDFCache.get(url);
                let loadingTask;

                if (cachedData) {
                    loadingTask = pdfjsLib.getDocument({ data: cachedData });
                } else {
                    // Configure PDF.js options
                    const pdfOptions: any = { url: finalUrl };

                    if (isArxiv) {
                        // Disable Range/Stream requests to avoid OPTIONS preflight
                        // This makes ArXiv serve the file as a simple GET request
                        pdfOptions.disableRange = true;
                        pdfOptions.disableStream = true;
                        console.log('[PDFViewer] Disabled Range/Stream for ArXiv (avoiding CORS preflight)');
                    }

                    loadingTask = pdfjsLib.getDocument(pdfOptions);
                }

                const pdfDoc = await loadingTask.promise;

                // If we fetched it (not from cache), store it
                if (!cachedData) {
                    const data = await pdfDoc.getData();
                    await PDFCache.set(url, data);
                }

                // Extract title from PDF metadata
                if (onTitleLoad) {
                    try {
                        const metadata = await pdfDoc.getMetadata();
                        console.log('[PDFViewer] PDF Metadata:', metadata.info);
                        const title = (metadata.info as any)?.Title || '';
                        if (title) {
                            console.log('[PDFViewer] Found PDF title:', title);
                            onTitleLoad(title);
                        } else {
                            console.log('[PDFViewer] No title in PDF metadata');
                        }
                    } catch (e) {
                        console.log('Could not extract PDF metadata:', e);
                    }
                }

                setPdf(pdfDoc);
                onLoad(pdfDoc.numPages);
                setLoading(false);
            } catch (reason: any) {
                console.error('Error loading PDF:', reason);
                setError(`Failed to load PDF: ${reason.message || reason}`);
                setLoading(false);
            }
        };

        loadPDF();

        return () => {
            // Cleanup if needed (pdfjs-dist handles most things)
        };
    }, [url]);

    useEffect(() => {
        if (!pdf || !canvasRef.current || !containerRef.current) return;

        setRendering(true);

        const renderPage = () => {
            pdf.getPage(page).then((pdfPage) => {
                const canvas = canvasRef.current!;
                const container = containerRef.current!;
                const context = canvas.getContext('2d')!;

                const viewport = pdfPage.getViewport({ scale: 1 });
                // Fill the available width
                const containerWidth = container.clientWidth;
                const scale = containerWidth / viewport.width;
                const scaledViewport = pdfPage.getViewport({ scale });

                const outputScale = window.devicePixelRatio || 1;
                canvas.width = Math.floor(scaledViewport.width * outputScale);
                canvas.height = Math.floor(scaledViewport.height * outputScale);
                canvas.style.width = Math.floor(scaledViewport.width) + "px";
                canvas.style.height = Math.floor(scaledViewport.height) + "px";

                const renderContext = {
                    canvasContext: context,
                    canvas: canvas,
                    viewport: scaledViewport,
                    transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
                };

                pdfPage.render(renderContext).promise.then(() => {
                    setRendering(false);
                    onRender(scaledViewport);
                });
            });
        };

        renderPage();

        window.addEventListener('resize', renderPage);
        return () => window.removeEventListener('resize', renderPage);
    }, [pdf, page]);

    if (error) {
        return (
            <div className="premium-card" style={{ padding: '2rem', color: '#ef4444', margin: '2rem' }}>
                {error}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="pdf-viewer-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <span>Loading PDF...</span>
                </div>
            )}
            {!loading && rendering && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <span>Rendering page...</span>
                </div>
            )}
            <div
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: pinchStartDistance !== null ? 'none' : 'transform 0.1s ease-out'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <canvas ref={canvasRef} style={{ display: 'block' }} />
                {children}
            </div>
        </div>
    );
}
