/**
 * DialogContext.jsx — App-level custom confirm / prompt dialogs.
 * Replaces native confirm() and prompt() which exit fullscreen on Chromium.
 *
 * Usage:
 *   const { confirm, prompt } = useDialog();
 *   const ok = await confirm('Silmek istediğinize emin misiniz?');
 *   const name = await prompt('Oyun adı:', 'Varsayılan');
 */
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
    const [dialog, setDialog] = useState(null); // { type, message, defaultValue, resolve }
    const inputRef = useRef(null);

    const closeWith = (value) => {
        dialog?.resolve(value);
        setDialog(null);
    };

    const confirm = useCallback((message) =>
        new Promise(resolve => {
            setDialog({ type: 'confirm', message, resolve });
        }), []);

    const prompt = useCallback((message, defaultValue = '') =>
        new Promise(resolve => {
            setDialog({ type: 'prompt', message, defaultValue, resolve });
            // Autofocus after render
            setTimeout(() => inputRef.current?.focus(), 50);
        }), []);

    return (
        <DialogContext.Provider value={{ confirm, prompt }}>
            {children}
            {dialog && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'var(--overlay-bg)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 0.15s ease',
                    }}
                    onMouseDown={e => e.target === e.currentTarget && closeWith(dialog.type === 'confirm' ? false : null)}
                >
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-base)',
                        borderRadius: '16px', padding: '28px 32px', minWidth: '320px', maxWidth: '460px',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                        animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        <p style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: 1.5, color: 'var(--text-main)' }}>
                            {dialog.message}
                        </p>

                        {dialog.type === 'prompt' && (
                            <input
                                ref={inputRef}
                                type="text"
                                defaultValue={dialog.defaultValue}
                                id="dialog-input"
                                style={{ width: '100%', marginBottom: '18px', fontSize: '14px' }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') closeWith(e.target.value || null);
                                    if (e.key === 'Escape') closeWith(null);
                                }}
                            />
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                className="btn"
                                onClick={() => closeWith(dialog.type === 'confirm' ? false : null)}
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-base)' }}
                            >
                                İptal
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (dialog.type === 'confirm') closeWith(true);
                                    else closeWith(document.getElementById('dialog-input')?.value || null);
                                }}
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error('useDialog must be used within DialogProvider');
    return ctx;
}
