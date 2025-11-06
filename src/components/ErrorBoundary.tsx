import React from "react";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Log to console ALWAYS (even in production)
    console.error('🔴 ERROR BOUNDARY CAUGHT:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console ALWAYS (even in production)
    console.error('🔴 UNCAUGHT ERROR:', error);
    console.error('🔴 ERROR INFO:', errorInfo);
    console.error('🔴 COMPONENT STACK:', errorInfo.componentStack);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Bir hata oluştu</h1>
              <p className="text-muted-foreground">
                Üzgünüz, beklenmeyen bir hata meydana geldi.
              </p>
            </div>
            {this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold mb-2">
                  Hata detayları
                </summary>
                <pre className="text-xs overflow-auto whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Sayfayı Yenile
              </Button>
              <Button
                onClick={() => window.location.href = "/"}
                variant="outline"
              >
                Ana Sayfaya Dön
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
