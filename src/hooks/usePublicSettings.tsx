import { useState, useEffect } from "react";

interface CoverTopic {
  icon: string;
  text: string;
}

interface PublicSettings {
  subdomain: string;
  cover_enabled: boolean;
  cover_title: string;
  cover_subtitle: string;
  cover_cta_text: string;
  cover_image_url: string | null;
  cover_topics: CoverTopic[];
  bg_gradient_from: string;
  bg_gradient_via: string;
  bg_gradient_to: string;
  bg_gradient_direction: string;
  success_title: string;
  success_subtitle: string;
  success_description: string;
  whatsapp_enabled: boolean;
  whatsapp_on_submit: boolean;
}

interface PublicSuccessPage {
  id: string;
  page_key: string;
  title: string;
  subtitle: string;
  description: string;
  whatsapp_enabled: boolean;
}

interface PublicQuestion {
  id: string;
  step: number;
  question: string;
  subtitle?: string;
  options: string[];
  field_name: string;
  input_type?: "text" | "select" | "password" | "buttons";
  max_length?: number;
  input_placeholder?: string;
  required?: boolean;
  conditional_logic?: any;
}

interface PublicData {
  settings: PublicSettings | null;
  questions: PublicQuestion[];
  successPages: PublicSuccessPage[];
}

export const usePublicSettings = (subdomain: string) => {
  const [data, setData] = useState<PublicData>({
    settings: null,
    questions: [],
    successPages: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(
          `${supabaseUrl}/functions/v1/get-public-settings?subdomain=${encodeURIComponent(subdomain)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Transform questions
        const transformedQuestions = (result.questions || []).map((item: any) => ({
          ...item,
          options: Array.isArray(item.options) ? item.options : [],
          input_type: ["select", "text", "password", "buttons"].includes(item.input_type) 
            ? item.input_type 
            : "text",
          required: item.required !== undefined ? item.required : true,
        }));

        // Transform cover_topics
        const defaultTopics: CoverTopic[] = [
          { icon: "CheckCircle", text: "Tópico 1" },
          { icon: "CheckCircle", text: "Tópico 2" },
          { icon: "CheckCircle", text: "Tópico 3" },
        ];

        const settings = result.settings ? {
          ...result.settings,
          cover_topics: Array.isArray(result.settings.cover_topics) 
            ? result.settings.cover_topics 
            : defaultTopics,
          bg_gradient_from: result.settings.bg_gradient_from || '#f0f9ff',
          bg_gradient_via: result.settings.bg_gradient_via || '#ffffff',
          bg_gradient_to: result.settings.bg_gradient_to || '#faf5ff',
          bg_gradient_direction: result.settings.bg_gradient_direction || 'to-br',
        } : null;

        setData({
          settings,
          questions: transformedQuestions,
          successPages: result.successPages || [],
        });
      } catch (err) {
        console.error("[usePublicSettings] Error fetching public settings:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (subdomain) {
      fetchPublicSettings();
    }
  }, [subdomain]);

  return { ...data, loading, error };
};
