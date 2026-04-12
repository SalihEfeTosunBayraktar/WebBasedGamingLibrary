import React from 'react';
import { Play } from 'lucide-react';
import { COVERS_BASE } from '../../api/api.js';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export default function GameCard({ game, index, focusedIndex, layout, onOpen, onPlay }) {
    const isFocused = focusedIndex === index;
    const { t } = useLocale();

    const lastPlayedLabel = game.lastPlayed
        ? `${t('card.lastPlayed')}: ${new Date(game.lastPlayed).toLocaleDateString()}`
        : t('card.newlyAdded');

    return (
        <div
            className={`game-card ${isFocused ? 'focused' : ''}`}
            onMouseEnter={() => {
                const event = new CustomEvent('gamehover', { detail: { index } });
                document.dispatchEvent(event);
            }}
            onClick={() => onOpen(game)}
            onContextMenu={(e) => { e.preventDefault(); onOpen(game); }}
        >
            {game.cover ? (
                <img
                    src={`${COVERS_BASE}/${game.cover}?t=${game._ts || ''}`}
                    alt={game.name}
                    className="game-card-cover"
                    loading="lazy"
                />
            ) : (
                <div className="fallback-cover">
                    {game.name.charAt(0).toUpperCase()}
                </div>
            )}

            {/* Quick play overlay (hidden in wide layout) */}
            <div
                className="quick-play-overlay"
                onClick={(e) => { e.stopPropagation(); onPlay(game.id); }}
            >
                <Play fill="currentColor" size={44} />
            </div>

            {/* Title & last played overlay */}
            <div className="game-card-overlay">
                <div className="game-title">{game.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '3px' }}>
                    {lastPlayedLabel}
                </div>
            </div>
        </div>
    );
}
