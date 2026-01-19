import { useRef, useState } from 'preact/hooks';
import { type Annotation } from '../hooks/useURLState';
import { RECTCOLOURS } from '../utils/constants';
import { NoteModal } from './NoteModal';

interface AnnotationLayerProps {
    page: number;
    annotations: Annotation[];
    alpha: number;
    viewport: any;
    currentColor: string;
    onAddAnnotation: (annotation: Annotation) => void;
    onUpdateAnnotation: (index: number, note: string) => void;
    onDeleteAnnotation: (index: number) => void;
}

export function AnnotationLayer({
    page,
    annotations,
    alpha,
    viewport,
    currentColor,
    onAddAnnotation,
    onUpdateAnnotation,
    onDeleteAnnotation,
}: AnnotationLayerProps) {
    const [drawing, setDrawing] = useState(false);
    const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
    const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [modalState, setModalState] = useState<{ isOpen: boolean; index?: number; initialNote: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const pageAnnotations = annotations
        .map((a, i) => ({ ...a, originalIndex: i }))
        .filter((a) => a.page === page);

    const getEventCoords = (e: MouseEvent | TouchEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
        // Allow multi-touch gestures (pinch-zoom, two-finger scroll) to pass through
        if ('touches' in e && e.touches.length > 1) return;
        if ('button' in e && e.button !== 0) return;
        // Don't preventDefault on start - let the gesture begin naturally
        const { x, y } = getEventCoords(e);
        setOrigin({ x, y });
        setDrawing(true);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        // Allow multi-touch gestures (pinch-zoom, two-finger scroll)
        if ('touches' in e && e.touches.length > 1) {
            // Cancel any drawing if user switches to multi-touch
            if (drawing) {
                setDrawing(false);
                setOrigin(null);
                setCurrentRect(null);
            }
            return;
        }
        if (!drawing || !origin) return;
        e.preventDefault(); // Only prevent scroll during single-finger drag
        const { x, y } = getEventCoords(e);

        setCurrentRect({
            x: Math.min(origin.x, x),
            y: Math.min(origin.y, y),
            w: Math.abs(x - origin.x),
            h: Math.abs(y - origin.y),
        });
    };

    const handleEnd = () => {
        if (!drawing) return;

        if (currentRect && currentRect.w > 0.01 && currentRect.h > 0.01) {
            // Stop drawing immediately so rectangle stops following mouse
            setDrawing(false);
            setOrigin(null);
            setModalState({ isOpen: true, initialNote: '' });
            return;
        }

        setDrawing(false);
        setOrigin(null);
        setCurrentRect(null);
    };

    const handleSaveNote = (note: string) => {
        if (modalState?.index !== undefined) {
            onUpdateAnnotation(modalState.index, note);
        } else if (currentRect) {
            onAddAnnotation({
                page,
                color: currentColor,
                x1: currentRect.x,
                y1: currentRect.y,
                x2: currentRect.x + currentRect.w,
                y2: currentRect.y + currentRect.h,
                note,
            });
        }
        setModalState(null);
        setDrawing(false);
        setOrigin(null);
        setCurrentRect(null);
    };

    const handleDelete = () => {
        if (modalState?.index !== undefined) {
            onDeleteAnnotation(modalState.index);
        }
        setModalState(null);
    };


    return (
        <>
            {modalState?.isOpen && (
                <NoteModal
                    initialNote={modalState.initialNote}
                    onSave={handleSaveNote}
                    onCancel={() => setModalState(null)}
                    onDelete={modalState.index !== undefined ? handleDelete : undefined}
                />
            )}
            <div
                ref={containerRef}
                id="annotation-layer"
                style={{
                    width: viewport.width,
                    height: viewport.height,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                onContextMenu={(e) => e.preventDefault()}
            >
                {pageAnnotations.map((ann) => (
                    <div
                        key={ann.originalIndex}
                        className="annotation-rectangle"
                        style={{
                            position: 'absolute',
                            left: ann.x1 * 100 + '%',
                            top: ann.y1 * 100 + '%',
                            width: (ann.x2 - ann.x1) * 100 + '%',
                            height: (ann.y2 - ann.y1) * 100 + '%',
                            backgroundColor: RECTCOLOURS[ann.color] || ann.color,
                            opacity: hoveredIdx === ann.originalIndex ? alpha + 0.2 : alpha,
                            cursor: 'pointer',
                            border: hoveredIdx === ann.originalIndex ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '2px',
                            boxShadow: hoveredIdx === ann.originalIndex ? '0 0 15px rgba(255,255,255,0.3)' : 'none',
                            transition: 'all 0.2s',
                            zIndex: hoveredIdx === ann.originalIndex ? 100 : 1,
                            transform: hoveredIdx === ann.originalIndex ? 'scale(1.02)' : 'scale(1)',
                        }}
                        onMouseEnter={() => setHoveredIdx(ann.originalIndex)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        title={ann.note}
                        onClick={(e) => {
                            e.stopPropagation();
                            setModalState({ isOpen: true, index: ann.originalIndex, initialNote: ann.note });
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setModalState({ isOpen: true, index: ann.originalIndex, initialNote: ann.note });
                        }}
                    />
                ))}
                {currentRect && (
                    <div
                        style={{
                            position: 'absolute',
                            left: currentRect.x * 100 + '%',
                            top: currentRect.y * 100 + '%',
                            width: currentRect.w * 100 + '%',
                            height: currentRect.h * 100 + '%',
                            border: '2px dashed white',
                            backgroundColor: RECTCOLOURS[currentColor],
                            opacity: alpha,
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </div>
        </>
    );
}
