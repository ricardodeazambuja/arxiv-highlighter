import { createPortal } from 'preact/compat';

interface NoteModalProps {
    initialNote: string;
    onSave: (note: string) => void;
    onCancel: () => void;
    onDelete?: () => void;
}

export function NoteModal({ initialNote, onSave, onCancel, onDelete }: NoteModalProps) {
    const handleSubmit = (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        onSave(formData.get('note') as string);
    };

    // Use portal to render outside zoomed container
    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content premium-card">
                <h3>{onDelete ? 'Edit Note' : 'Add Note'}</h3>
                <form onSubmit={handleSubmit}>
                    <textarea
                        name="note"
                        defaultValue={initialNote}
                        placeholder="Type your note here..."
                        autoFocus
                    />
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        {onDelete && (
                            <button type="button" className="btn-danger" onClick={onDelete}>
                                Delete
                            </button>
                        )}
                        <button type="submit" className="btn-primary">
                            Save Note
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
