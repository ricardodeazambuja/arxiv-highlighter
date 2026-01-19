import { RECTCOLOURS, RECTCOLOURS_KEYS } from '../utils/constants';

interface ToolbarProps {
    currentColor: string;
    onColorChange: (color: string) => void;
    alpha: number;
    onAlphaChange: (alpha: number) => void;
}

export function Toolbar({ currentColor, onColorChange, alpha, onAlphaChange }: ToolbarProps) {
    return (
        <div className="toolbar premium-card">
            <div className="toolbar-section">
                {RECTCOLOURS_KEYS.map((key) => (
                    <button
                        key={key}
                        className={`color-swatch ${currentColor === key ? 'active' : ''}`}
                        style={{ backgroundColor: RECTCOLOURS[key] }}
                        onClick={() => onColorChange(key)}
                        title={RECTCOLOURS[key].toUpperCase()}
                    />
                ))}
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-section alpha-section">
                <label className="alpha-label">
                    <span>Opacity</span>
                    <span className="alpha-value">{Math.round(alpha * 100)}%</span>
                </label>
                <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={alpha}
                    onChange={(e) => onAlphaChange(parseFloat((e.target as HTMLInputElement).value))}
                    className="alpha-slider"
                />
            </div>
        </div>
    );
}
