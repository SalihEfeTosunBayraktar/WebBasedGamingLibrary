import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { LocaleProvider } from './i18n/LocaleContext.jsx';
import { DialogProvider } from './context/DialogContext.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LocaleProvider>
            <DialogProvider>
                <App />
            </DialogProvider>
        </LocaleProvider>
    </StrictMode>,
);
