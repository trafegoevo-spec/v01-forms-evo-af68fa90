import { useState } from "react";
import logoImage from "@/assets/logo.jpg";

const LOGO_STORAGE_KEY = "custom_logo";

export const LogoDisplay = () => {
  const [logoUrl] = useState<string | null>(() => {
    return localStorage.getItem(LOGO_STORAGE_KEY) || logoImage;
  });

  return (
    <div className="flex justify-center pt-8 pb-6">
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Logo"
          className="w-24 h-24 rounded-full object-cover shadow-lg"
        />
      )}
    </div>
  );
};
