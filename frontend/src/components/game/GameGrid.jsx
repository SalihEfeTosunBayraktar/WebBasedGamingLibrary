import React from 'react';
import { Gamepad2 } from 'lucide-react';
import GameCard from './GameCard.jsx';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export default function GameGrid({ games, layout, focusedIndex, onOpen, onPlay, loading, containerRef: externalRef }) {
    const { t } = useLocale();
    const internalRef = React.useRef(null);
    const containerRef = externalRef || internalRef;

    React.useEffect(() => {
        if (layout === 'ps' && focusedIndex >= 0 && containerRef.current) {
            const children = containerRef.current.children;
            if (children[focusedIndex]) {
                children[focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }
    }, [focusedIndex, layout]);

    if (loading) {
        return (
            <div className="empty-state">
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)' }}>{t('grid.loading')}</p>
            </div>
        );
    }

    if (games.length === 0) {
        return (
            <div className="empty-state">
                <Gamepad2 />
                <h3>{t('grid.emptyTitle')}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{t('grid.emptyDesc')}</p>
            </div>
        );
    }

    const containerClass = layout === 'wide' ? 'game-layout-wide' : layout === 'ps' ? 'game-layout-ps' : 'game-grid';

    return (
        <div className={containerClass} ref={containerRef}>
            {games.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} focusedIndex={focusedIndex}
                    layout={layout} onOpen={onOpen} onPlay={onPlay} />
            ))}
        </div>
    );
}
