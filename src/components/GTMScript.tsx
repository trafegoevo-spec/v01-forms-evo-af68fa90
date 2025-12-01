import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubdomain } from "@/hooks/useSubdomain";

export const GTMScript = () => {
  const subdomain = useSubdomain();
  
  useEffect(() => {
    const loadGTM = async () => {
      try {
        const { data: settings } = await supabase
          .from("app_settings")
          .select("gtm_id")
          .eq("subdomain", subdomain)
          .single();

        const gtmId = settings?.gtm_id || "GTM-PRW9TPH";

        // Inject GTM script in head
        if (!document.querySelector(`script[src*="${gtmId}"]`)) {
          const script = document.createElement("script");
          script.innerHTML = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `;
          document.head.appendChild(script);

          // Inject GTM noscript in body
          const noscript = document.createElement("noscript");
          const iframe = document.createElement("iframe");
          iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
          iframe.height = "0";
          iframe.width = "0";
          iframe.style.display = "none";
          iframe.style.visibility = "hidden";
          noscript.appendChild(iframe);
          document.body.insertBefore(noscript, document.body.firstChild);
        }
      } catch (error) {
        console.error("Error loading GTM:", error);
      }
    };

    loadGTM();
  }, [subdomain]);

  return null;
};
