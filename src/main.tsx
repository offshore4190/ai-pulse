import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// 调试：确认入口已执行（若页面空白且控制台无此日志，说明脚本未加载）
console.log('[Daily Shot] Bootstrap loaded, mounting React...');

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('[Daily Shot] #root element not found!');
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
