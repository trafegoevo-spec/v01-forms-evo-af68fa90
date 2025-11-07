import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/logo.jpg";

const LOGO_STORAGE_KEY = "custom_logo";

export const LogoUploader = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem(LOGO_STORAGE_KEY) || logoImage;
  });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      localStorage.setItem(LOGO_STORAGE_KEY, base64);
      setLogoUrl(base64);
      setIsEditing(false);
      toast({
        title: "Logo atualizada!",
        description: "Sua logo foi salva com sucesso.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem(LOGO_STORAGE_KEY);
    setLogoUrl(null);
    setIsEditing(false);
    toast({
      title: "Logo removida",
      description: "A logo foi removida com sucesso.",
    });
  };

  return (
    <div className="flex justify-center pt-8 pb-6">
      <div className="relative group">
        {logoUrl ? (
          <div className="relative">
            <img
              src={logoUrl}
              alt="Logo"
              className="w-24 h-24 rounded-full object-cover shadow-lg"
            />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 rounded-full">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="absolute -bottom-2 -right-2 h-8 w-8 bg-white shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="text-center">
              <Upload className="h-6 w-6 mx-auto text-gray-400" />
              <p className="text-xs text-gray-500 mt-1">Logo</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
