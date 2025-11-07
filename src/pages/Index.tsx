import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MultiStepFormDynamic } from "@/components/MultiStepFormDynamic";
import { LogoUploader } from "@/components/LogoUploader";
import { AuthDialog } from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Settings } from "lucide-react";

const Index = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        setShowForm(true);
      } else {
        setShowAuthDialog(true);
      }
    }
  }, [user, loading]);

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Logo Upload */}
      <LogoUploader />

      {/* Admin and Logout buttons */}
      {user && (
        <div className="container mx-auto px-4 flex justify-end gap-2 mb-4">
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          )}
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </div>
      )}

      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={(open) => {
          setShowAuthDialog(open);
          if (!open && user) {
            handleAuthSuccess();
          }
        }} 
      />

      {/* Multi-Step Form */}
      {showForm && (
        <main className="container mx-auto px-4 pb-12">
          <MultiStepFormDynamic />
        </main>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© EVO Marketing & Tecnologia 2024. Otimize seus resultados de vendas.</p>
      </footer>
    </div>
  );
};

export default Index;
