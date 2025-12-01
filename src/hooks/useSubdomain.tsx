import { useMemo } from "react";

export const useSubdomain = () => {
  const subdomain = useMemo(() => {
    // Get the current hostname
    const hostname = window.location.hostname;
    
    // Extract subdomain from hostname
    // Example: universoagv.evoleads.app -> universoagv
    // Example: autoprotecta.evoleads.app -> autoprotecta
    // Example: localhost -> default
    const parts = hostname.split('.');
    
    // If localhost or IP, use 'default'
    if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return 'default';
    }
    
    // If it's a Lovable preview domain (e.g., xxx.lovable.app)
    if (parts.length === 3 && parts[1] === 'lovable' && parts[2] === 'app') {
      return 'default';
    }
    
    // If it's a custom domain with subdomain (e.g., universoagv.evoleads.app)
    if (parts.length >= 3) {
      return parts[0]; // Return first part as subdomain
    }
    
    // Otherwise use 'default'
    return 'default';
  }, []);

  return subdomain;
};

