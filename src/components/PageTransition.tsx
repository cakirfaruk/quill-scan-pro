import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide" | "slideUp" | "scale" | "spring" | "depth";
}

export const PageTransition = ({ children, variant = "fade" }: PageTransitionProps) => {
  return (
    <div className="w-full animate-fade-in">
      {children}
    </div>
  );
};

// HOC for wrapping page components
export const withPageTransition = (
  Component: React.ComponentType,
  variant: "fade" | "slide" | "slideUp" | "scale" = "fade"
) => {
  return (props: any) => (
    <PageTransition variant={variant}>
      <Component {...props} />
    </PageTransition>
  );
};
