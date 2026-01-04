import { AlertCircle, RefreshCw, ShoppingCart } from 'lucide-react';
import React, { Component, ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CartErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: 'minimal' | 'full';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface CartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary for Cart Components
 * Catches errors in cart functionality and provides graceful fallback UI
 * Implements error recovery mechanisms and logging
 */
export class CartErrorBoundary extends Component<CartErrorBoundaryProps, CartErrorBoundaryState> {
  constructor(props: CartErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CartErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('Cart Error Boundary caught an error:', error, errorInfo);

    // Track error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Placeholder for error tracking service integration
    const errorData = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // TODO: Send to error tracking service
    console.warn('Error logged:', errorData);
  }

  handleRecovery = () => {
    // Attempt to recover by clearing error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleClearCart = () => {
    try {
      // Clear cart from localStorage
      localStorage.removeItem('toa_shopping_cart');
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorCount: 0,
      });

      // Reload page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  renderMinimalFallback() {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Cart Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>There was an issue loading your cart. Please try refreshing the page.</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRecovery}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleClearCart}
            >
              Clear Cart
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  renderFullFallback() {
    const { error, errorInfo, errorCount } = this.state;

    return (
      <Card className="my-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Shopping Cart Error</CardTitle>
          </div>
          <CardDescription>
            We encountered an issue with your shopping cart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>What happened?</AlertTitle>
            <AlertDescription>
              {error?.message || 'An unexpected error occurred while loading your cart.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Recovery Options:</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={this.handleRecovery}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleClearCart}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Clear Cart & Restart
              </Button>
              <Button
                onClick={() => window.location.href = '/shop'}
                variant="outline"
              >
                Continue Shopping
              </Button>
            </div>
          </div>

          {errorCount > 2 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Persistent Issue Detected</AlertTitle>
              <AlertDescription>
                This error has occurred {errorCount} times. We recommend clearing your cart and
                starting fresh, or contacting support if the issue persists.
              </AlertDescription>
            </Alert>
          )}

          {process.env.NODE_ENV === 'development' && errorInfo && (
            <details className="mt-4 p-4 bg-muted rounded-lg text-xs">
              <summary className="cursor-pointer font-semibold mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="overflow-auto max-h-64 text-xs">
                {error?.stack}
                {'\n\n'}
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  render() {
    const { hasError } = this.state;
    const { children, fallbackUI = 'full' } = this.props;

    if (hasError) {
      return fallbackUI === 'minimal' 
        ? this.renderMinimalFallback() 
        : this.renderFullFallback();
    }

    return children;
  }
}

/**
 * Hook-based wrapper for functional components
 */
export function withCartErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackUI: 'minimal' | 'full' = 'full'
): React.FC<P> {
  return function CartErrorBoundaryWrapper(props: P) {
    return (
      <CartErrorBoundary fallbackUI={fallbackUI}>
        <Component {...props} />
      </CartErrorBoundary>
    );
  };
}
