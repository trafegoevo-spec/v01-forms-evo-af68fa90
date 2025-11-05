import { MultiStepForm } from "@/components/MultiStepForm";
import bannerImage from "@/assets/banner-education.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Banner - Desktop only */}
      <div className="hidden md:flex justify-center pt-8 pb-6">
        <img 
          src={bannerImage} 
          alt="Banner Educacional" 
          className="w-full max-w-[1200px] h-auto rounded-lg shadow-lg"
        />
      </div>

      {/* Multi-Step Form */}
      <main className="container mx-auto px-4 pb-12 pt-8 md:pt-0">
        <MultiStepForm />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© EVO Marketing & Tecnologia 2024. Otimize seus resultados de vendas.</p>
      </footer>
    </div>
  );
};

export default Index;
