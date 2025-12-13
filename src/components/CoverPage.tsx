import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CoverPageProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onStart: () => void;
  imageUrl?: string;
}

export const CoverPage = ({ title, subtitle, ctaText, onStart, imageUrl }: CoverPageProps) => {
  // Parse subtitle into bullet points (split by newline or semicolon)
  const bulletPoints = subtitle
    .split(/[;\n]/)
    .map(point => point.trim())
    .filter(point => point.length > 0);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-background">
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 animate-[pulse_8s_ease-in-out_infinite]" />
      
      {/* Floating orbs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-[float_8s_ease-in-out_infinite_reverse]" />
      
      {/* Left Content Section */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20 lg:py-0">
        <div className="max-w-xl mx-auto lg:mx-0">
          {/* Title */}
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-8 leading-tight opacity-0 animate-[slideUp_0.8s_ease-out_0.2s_forwards]"
          >
            {title}
          </h1>
          
          {/* Bullet Points List */}
          <ul className="space-y-3 mb-10 opacity-0 animate-[slideUp_0.8s_ease-out_0.4s_forwards]">
            {bulletPoints.map((point, index) => (
              <li 
                key={index}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed"
              >
                • {point}
              </li>
            ))}
          </ul>
          
          {/* CTA Button */}
          <div className="opacity-0 animate-[slideUp_0.8s_ease-out_0.6s_forwards]">
            <Button
              size="lg"
              onClick={onStart}
              className="group text-lg px-8 py-6 h-auto rounded-full shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 active:scale-95"
            >
              {ctaText}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right Image Section */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-12 opacity-0 animate-[slideUp_0.8s_ease-out_0.3s_forwards]">
        <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
          {/* Image container with aspect ratio */}
          <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl bg-muted">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Landing page hero" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-muted-foreground/50 text-sm">Imagem</span>
              </div>
            )}
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/15 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
};
