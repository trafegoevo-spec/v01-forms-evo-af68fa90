import { MultiStepForm } from "@/components/MultiStepForm";
import { LogoUploader } from "@/components/LogoUploader";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Logo Upload */}
      <LogoUploader />

      {/* Multi-Step Form */}
      <main className="container mx-auto px-4 pb-12">
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
