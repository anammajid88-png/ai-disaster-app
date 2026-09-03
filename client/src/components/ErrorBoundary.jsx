import { Component } from 'react';

/**
 * Catches render-time crashes so a broken screen never leaves the user with a
 * blank page during an emergency. The fallback is passed in as an element so it
 * can be fully translated (a class component cannot use hooks).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
