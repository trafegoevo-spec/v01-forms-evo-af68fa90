import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MultiStepFormDynamic } from "@/components/MultiStepFormDynamic";
import { LogoDisplay } from "@/components/LogoDisplay";
import { CoverPage, CoverTopic } from "@/components/CoverPage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

interface CoverSettings {
  cover_enabled: boolean;
  cover_title: string;
  cover_subtitle: string;
  cover_cta_text: string;
  cover_image_url: string | null;
  cover_topics: CoverTopic[];
}
const Index = () => {
  const {
    user,
    isAdmin,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preview = searchParams.get("preview");
  const formName = import.meta.env.VITE_FORM_NAME || "default";
  const [showCover, setShowCover] = useState(true);
  const [coverSettings, setCoverSettings] = useState<CoverSettings | null>(null);
  const [loadingCover, setLoadingCover] = useState(true);
  useEffect(() => {
    // Redirect admin users to /admin after login, unless they're previewing
    if (!loading && user && isAdmin && preview !== "true") {
      navigate("/admin");
    }
  }, [user, isAdmin, loading, navigate, preview]);
  useEffect(() => {
    const loadCoverSettings = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from("app_settings").select("cover_enabled, cover_title, cover_subtitle, cover_cta_text, cover_image_url, cover_topics").eq("subdomain", formName).maybeSingle();
        
        const defaultTopics: CoverTopic[] = [
          { icon: "CheckCircle", text: "Tópico 1" },
          { icon: "CheckCircle", text: "Tópico 2" },
          { icon: "CheckCircle", text: "Tópico 3" }
        ];

        if (error) {
          console.error("Error loading cover settings:", error);
          setCoverSettings({
            cover_enabled: false,
            cover_title: "Bem-vindo",
            cover_subtitle: "Preencha o formulário e entre em contato conosco",
            cover_cta_text: "Começar",
            cover_image_url: null,
            cover_topics: defaultTopics
          });
          setShowCover(false);
        } else if (!data) {
          setCoverSettings({
            cover_enabled: false,
            cover_title: "Bem-vindo",
            cover_subtitle: "Preencha o formulário e entre em contato conosco",
            cover_cta_text: "Começar",
            cover_image_url: null,
            cover_topics: defaultTopics
          });
          setShowCover(false);
        } else {
          const topics = Array.isArray(data.cover_topics) 
            ? (data.cover_topics as unknown as CoverTopic[])
            : defaultTopics;
          setCoverSettings({
            cover_enabled: data.cover_enabled,
            cover_title: data.cover_title,
            cover_subtitle: data.cover_subtitle,
            cover_cta_text: data.cover_cta_text,
            cover_image_url: data.cover_image_url,
            cover_topics: topics
          });
          setShowCover(data.cover_enabled);
        }
      } catch (error) {
        console.error("Error loading cover settings:", error);
      } finally {
        setLoadingCover(false);
      }
    };
    loadCoverSettings();
  }, [formName]);
  const handleStartForm = () => {
    setShowCover(false);
  };
  if (loadingCover) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>;
  }

  // Show cover page if enabled and not dismissed
  if (coverSettings?.cover_enabled && showCover) {
    return <div className="min-h-screen bg-background">
        {/* Admin button on cover */}
        {isAdmin && <div className="absolute top-6 right-6 z-20">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </div>}
        
        <CoverPage 
          title={coverSettings.cover_title} 
          subtitle={coverSettings.cover_subtitle}
          topics={coverSettings.cover_topics}
          ctaText={coverSettings.cover_cta_text} 
          onStart={handleStartForm} 
          imageUrl={coverSettings.cover_image_url || undefined}
        />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Logo Display */}
      <LogoDisplay />

      {/* Admin button */}
      {isAdmin && <div className="container mx-auto px-4 flex justify-end gap-2 mb-4">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <Settings className="mr-2 h-4 w-4" />
            Admin
          </Button>
        </div>}

      {/* Multi-Step Form */}
      <main className="container mx-auto pb-12 px-[5px]">
        <MultiStepFormDynamic />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© EVO Marketing & Tecnologia 2024. Otimize seus resultados de vendas.</p>
      </footer>
    </div>;
};
export default Index;