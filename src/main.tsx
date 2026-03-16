import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css';

const LANGUAGE_STORAGE_KEY = 'daily-shot-language';

function syncDocumentLang(lang: 'zh' | 'en') {
  const isZh = lang === 'zh';
  document.documentElement.lang = isZh ? 'zh-CN' : 'en';
  document.title = isZh ? 'Daily Shot. 今天AI在干嘛' : 'Daily Shot. What AI Is Up To Today';
  const desc = isZh
    ? '今天AI在干嘛 - 高密度 AI 情报仪表盘，整合学生学习洞察与投资人信号'
    : 'What AI is up to today - High-density AI intelligence dashboard for students and investors';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', desc);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', isZh ? 'Daily Shot. 今天AI在干嘛' : 'Daily Shot. What AI Is Up To Today');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', desc);
}

try {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const lang = stored === 'zh' || stored === 'en' ? stored : (navigator.language.startsWith('zh') ? 'zh' : 'en');
  syncDocumentLang(lang);
} catch {
  syncDocumentLang('zh');
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('[Daily Shot] #root element not found!');
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <LanguageProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </LanguageProvider>
    </StrictMode>,
  );
}
