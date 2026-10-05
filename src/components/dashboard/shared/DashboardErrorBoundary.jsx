// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD ERROR BOUNDARY — Enterprise-Grade Resilience Guardrail
// ══════════════════════════════════════════════════════════════════════════════
import React, { Component } from 'react';

class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error Boundary Caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 backdrop-blur-md shadow-sm my-3 text-start">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">⚠️</span>
            <h4 className="text-sm font-black text-rose-800 dark:text-rose-300">
              {this.props.title || 'Widget Temporarily Unavailable'}
            </h4>
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-400 mb-2 leading-relaxed font-semibold">
            Rendering error detected:
          </p>
          <pre className="p-3 bg-slate-900 text-rose-300 text-xs font-mono rounded-xl overflow-x-auto mb-4 border border-rose-900/50 leading-normal select-all">
            {this.state.error ? (this.state.error.stack || this.state.error.toString()) : 'Unknown Error'}
          </pre>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs transition-colors"
          >
            Retry Widget 🔄
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
