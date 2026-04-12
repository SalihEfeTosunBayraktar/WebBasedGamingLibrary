/**
 * HeroBackground.jsx — Crossfade animated hero background for PS (console) layout.
 * When the focused game changes, the new image fades in while the old fades out.
 */
import React, { useState, useEffect, useRef } from 'react';

const FADE_MS = 600;

export default function HeroBackground({ src }) {
    const [layers, setLayers] = useState([{ id: 0, src, active: true }]);
    const counterRef = useRef(1);

    useEffect(() => {
        setLayers(prev => {
            const last = prev[prev.length - 1];
            if (last?.src === src) return prev;

            const id = counterRef.current++;
            // Deactivate all existing layers, add new active one
            const next = [...prev.map(l => ({ ...l, active: false })), { id, src, active: true }];
            // Remove old inactive layers after transition
            setTimeout(() => {
                setLayers(cur => cur.filter(l => l.active));
            }, FADE_MS + 50);
            return next;
        });
    }, [src]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden' }}>
            {layers.map(layer => (
                <div
                    key={layer.id}
                    style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: layer.src || 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: layer.active ? 1 : 0,
                        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                        filter: 'blur(2px) brightness(0.35)',
                        transform: 'scale(1.05)', // hide blur edges
                    }}
                />
            ))}
        </div>
    );
}
