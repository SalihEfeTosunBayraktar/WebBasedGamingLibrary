// Reusable section wrapper used across all settings tabs
import React from 'react';

export default function Section({ title, desc, children }) {
    return (
        <div>
            <h4 style={{
                color: 'var(--accent)',
                marginBottom: desc ? '6px' : '14px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '14px',
            }}>
                {title}
            </h4>
            {desc && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {desc}
                </p>
            )}
            {children}
        </div>
    );
}
