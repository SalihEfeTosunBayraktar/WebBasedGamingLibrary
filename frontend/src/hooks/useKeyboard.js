/**
 * useKeyboard.js — Keyboard navigation hook.
 * Maps keyboard events to the same callback interface as useGamepad so
 * App.jsx can pass identical handlers to both inputs without duplication.
 *
 * Bindings:
 *   ArrowUp/Down/Left/Right / W/A/S/D  → onUp / onDown / onLeft / onRight
 *   Enter                              → onHoldA   (quick launch)
 *   F                                  → onSelect  (open details panel)
 *   Escape                             → onBack
 *   Q                                  → onLB  (categories)
 *   E                                  → onRB  (sorting)
 */
import { useEffect, useRef } from 'react';

const KEY_MAP = {
    ArrowUp:    'onUp',
    ArrowDown:  'onDown',
    ArrowLeft:  'onLeft',
    ArrowRight: 'onRight',
    w:          'onUp',
    W:          'onUp',
    s:          'onDown',
    S:          'onDown',
    a:          'onLeft',
    A:          'onLeft',
    d:          'onRight',
    D:          'onRight',
    ' ':        'onHoldA',   // Direct launch
    f:          'onSelect',  // Open detail panel
    F:          'onSelect',
    Escape:     'onBack',
    q:          'onLB',      // Categories
    Q:          'onLB',
    e:          'onRB',      // Sorting
    E:          'onRB',
};

/** Returns true when the user is actively typing in a text field */
function isTypingInInput() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
}

// Keys that must not fire when typing (letter keys would interfere with text input)
const LETTER_KEYS = new Set(['w','W','s','S','a','A','d','D','q','Q','e','E','i','I']);

export function useKeyboard(callbacks) {
    const cbRef = useRef(callbacks);
    useEffect(() => { cbRef.current = callbacks; });

    useEffect(() => {
        const onKeyDown = (e) => {
            // Block ALL keys if user is typing in a real input field
            if (isTypingInInput() && e.key !== 'Escape') return;

            const cbName = KEY_MAP[e.key];
            if (!cbName) return;

            // Prevent default browser scroll for arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            cbRef.current[cbName]?.();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
}
