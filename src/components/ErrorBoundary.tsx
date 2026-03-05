import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** 当子组件抛出未捕获错误时，显示优雅的报错提示，避免整页空白 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-rose-100 p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">页面加载出错</h1>
            <p className="text-sm text-gray-600 mb-4">
              某个组件渲染时发生错误。请刷新页面重试，或查看控制台获取详情。
            </p>
            <details className="text-left mb-6">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                查看错误信息
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-rose-700 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-6 py-2 rounded-xl transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
