import { RECTCOLOURS_KEYS, RECTCOLOURS } from '../utils/constants';

interface HelpModalProps {
    onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content help-modal" onClick={(e) => e.stopPropagation()}>
                <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>How to Use</h2>

                <div className="help-section">
                    <h3>🖱️ Mouse / Trackpad</h3>
                    <ul>
                        <li><strong>Create highlight:</strong> Click and drag to draw a rectangle</li>
                        <li><strong>Edit note:</strong> Click on any highlight</li>
                        <li><strong>Delete:</strong> Click a highlight, then use the Delete button</li>
                    </ul>
                </div>

                <div className="help-section">
                    <h3>📱 Touch Screen</h3>
                    <ul>
                        <li><strong>Create highlight:</strong> Touch and drag</li>
                        <li><strong>Edit note:</strong> Tap on any highlight</li>
                    </ul>
                </div>

                <div className="help-section">
                    <h3>🎨 Colors</h3>
                    <p>Use the color palette in the top-right corner to change the highlight color.</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {RECTCOLOURS_KEYS.map((key) => (
                            <div
                                key={key}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: RECTCOLOURS[key],
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="help-section">
                    <h3>🔗 Sharing</h3>
                    <p>All annotations are saved in the URL. Simply share the URL and others will see your exact highlights and notes!</p>
                </div>

                <div className="help-section">
                    <h3>⚙️ URL Parameters</h3>
                    <ul style={{ fontSize: '0.85rem' }}>
                        <li><code>#url=...</code> — PDF or ArXiv URL</li>
                        <li><code>&page=N</code> — Start at page N</li>
                        <li><code>&alpha=0.3</code> — Highlight transparency (0-1)</li>
                        <li><code>&cdata=...</code> — Compressed annotation data</li>
                    </ul>
                </div>

                <div className="modal-actions">
                    <button className="btn-primary" onClick={onClose}>Got it!</button>
                </div>
            </div>
        </div>
    );
}
