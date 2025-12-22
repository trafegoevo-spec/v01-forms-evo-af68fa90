import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";

export interface CoverTopic {
  icon: string;
  text: string;
}

interface CoverPageProps {
  title: string;
  subtitle: string;
  topics: CoverTopic[];
  ctaText: string;
  onStart: () => void;
  imageUrl?: string;
}

export const CoverPage = ({ title, subtitle, ctaText, onStart, imageUrl }: CoverPageProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background px-6 py-12">
      {/* Soft blue orb at top */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-24 h-24 md:w-32 md:h-32 bg-primary/10 rounded-full blur-sm opacity-0 animate-fade-in" />
      
      {/* Optional logo/image */}
      {imageUrl && (
        <div className="mb-6 opacity-0 animate-slide-up z-10">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-2xl overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="max-w-lg mx-auto text-center z-10 mt-8">
        {/* Title - bold, benefit-oriented */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight opacity-0 animate-slide-up stagger-1">
          {title}
        </h1>
        
        {/* Subtitle - value proposition with time estimate */}
        <p className="text-base md:text-lg text-muted-foreground mb-10 opacity-0 animate-slide-up stagger-2 leading-relaxed">
          {subtitle}
        </p>
        
        {/* Single CTA Button - prominent */}
        <div className="opacity-0 animate-slide-up stagger-3 mb-6">
          <Button
            size="lg"
            onClick={onStart}
            className="typeform-button group text-base md:text-lg px-8 md:px-12 py-6 md:py-7 h-auto rounded-xl shadow-xl hover:shadow-2xl font-semibold min-w-[200px] bg-primary hover:bg-primary/90"
          >
            {ctaText}
            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
        
        {/* Time estimate below button */}
        <div className="inline-flex items-center gap-2 opacity-0 animate-slide-up stagger-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tempo estimado: 45 segundos</span>
        </div>
      </div>
    </div>
  );
};
