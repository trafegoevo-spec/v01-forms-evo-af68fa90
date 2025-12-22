import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";

interface CoverPageProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onStart: () => void;
  estimatedTime?: string;
}

export const CoverPage = ({ 
  title, 
  subtitle, 
  ctaText, 
  onStart,
  estimatedTime = "Leva menos de 45 segundos"
}: CoverPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Main content - centered */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="space-y-8">
          {/* Title with conversational tone */}
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight opacity-0 animate-fadeInUp"
            style={{ animationDelay: '0.1s' }}
          >
            {title}
          </h1>
          
          {/* Subtitle */}
          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto opacity-0 animate-fadeInUp"
            style={{ animationDelay: '0.2s' }}
          >
            {subtitle}
          </p>
          
          {/* CTA Button - large and inviting */}
          <div 
            className="pt-4 opacity-0 animate-fadeInUp"
            style={{ animationDelay: '0.3s' }}
          >
            <Button
              size="lg"
              onClick={onStart}
              className="group text-lg px-10 py-7 h-auto rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {ctaText}
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>
          
          {/* Time indicator - subtle and reassuring */}
          <div 
            className="flex items-center justify-center gap-2 text-muted-foreground opacity-0 animate-fadeInUp"
            style={{ animationDelay: '0.4s' }}
          >
            <Clock className="h-4 w-4" />
            <span className="text-sm">{estimatedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
