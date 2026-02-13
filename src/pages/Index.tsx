import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MultiStepFormDynamic } from "@/components/MultiStepFormDynamic";
import { LogoDisplay } from "@/components/LogoDisplay";
import { CoverPage, CoverTopic } from "@/components/CoverPage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preview = searchParams.get("preview");
  const formName = import.meta.env.VITE_FORM_NAME || "default";
  const [showCover, setShowCover] = useState(true);

  // Single unified data fetch
  const { settings, questions, successPages, loading } = usePublicSettings(formName);

  const handleStartForm = () => {
    setShowCover(false);
  };

  // Helper to get gradient style
  const getGradientStyle = () => {
    if (!settings) return {};
    const direction = 
      settings.bg_gradient_direction === 'to-t' ? '0deg' :
      settings.bg_gradient_direction === 'to-b' ? '180deg' :
      settings.bg_gradient_direction === 'to-l' ? '270deg' :
      settings.bg_gradient_direction === 'to-r' ? '90deg' :
      settings.bg_gradient_direction === 'to-tl' ? '315deg' :
      settings.bg_gradient_direction === 'to-tr' ? '45deg' :
      settings.bg_gradient_direction === 'to-bl' ? '225deg' :
      '135deg';
    return {
      background: `linear-gradient(${direction}, ${settings.bg_gradient_from}, ${settings.bg_gradient_via}, ${settings.bg_gradient_to})`
    };
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center gap-6 p-8">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-6 w-72 rounded" />
        <div className="w-full max-w-md space-y-4 mt-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Show cover page if enabled and not dismissed
  if (settings?.cover_enabled && showCover) {
    return (
      <div className="min-h-screen" style={getGradientStyle()}>
        {isAdmin && (
          <div className="absolute top-6 right-6 z-20">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </div>
        )}
        <CoverPage 
          title={settings.cover_title} 
          subtitle={settings.cover_subtitle}
          topics={settings.cover_topics as unknown as CoverTopic[]}
          ctaText={settings.cover_cta_text} 
          onStart={handleStartForm}
          gradientStyle={getGradientStyle()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={getGradientStyle()}>
      <LogoDisplay />
      {isAdmin && (
        <div className="container mx-auto px-4 flex justify-end gap-2 mb-4">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <Settings className="mr-2 h-4 w-4" />
            Admin
          </Button>
        </div>
      )}
      <main className="container mx-auto pb-12 px-[5px]">
        <MultiStepFormDynamic 
          initialSettings={settings}
          initialQuestions={questions}
          initialSuccessPages={successPages}
        />
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© EVO Marketing & Tecnologia 2024. Otimize seus resultados de vendas.</p>
      </footer>
    </div>
  );
};

export default Index;
