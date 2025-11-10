import { useNavigate } from "react-router-dom";
import { MultiStepFormDynamic } from "@/components/MultiStepFormDynamic";
import { LogoUploader } from "@/components/LogoUploader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Settings } from "lucide-react";

const Index = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Logo Upload */}
      <LogoUploader />

      {/* Admin button */}
      {isAdmin && (
        <div className="container mx-auto px-4 flex justify-end gap-2 mb-4">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <Settings className="mr-2 h-4 w-4" />
            Admin
          </Button>
        </div>
      )}

      {/* Multi-Step Form */}
      <main className="container mx-auto px-4 pb-12">
        <MultiStepFormDynamic />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© EVO Marketing & Tecnologia 2024. Otimize seus resultados de vendas.</p>
      </footer>
    </div>
  );
};

export default Index;
