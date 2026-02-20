import { lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LandingPage } from "@/components/LandingPage";

const Feed = lazy(() => import("./Feed"));

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Feed />
      </Suspense>
    );
  }

  return <LandingPage />;
};

export default Index;
