import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import ErrorPage from './ErrorPage';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Render crash captured by ErrorBoundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          code="INTERNAL_ERROR"
          title="Défaillance de la machinerie"
          detail="Une erreur interne est survenue. Les ingénieurs ont été alertés."
        />
      );
    }
    return this.props.children;
  }
}
