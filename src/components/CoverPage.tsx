import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Star, Shield, Zap, Heart, Award, ThumbsUp, Clock, Target } from "lucide-react";

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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle,
  Star,
  Shield,
  Zap,
  Heart,
  Award,
  ThumbsUp,
  Clock,
  Target,
};

export const CoverPage = ({ title, subtitle, topics, ctaText, onStart, imageUrl }: CoverPageProps) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      
      {/* Floating orbs - subtle */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Main content - centered for mobile-first */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-lg mx-auto">
          {/* Optional image */}
          {imageUrl && (
            <div className="mb-8 opacity-0 animate-slide-up">
              <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden shadow-xl bg-muted">
                <img 
                  src={imageUrl} 
                  alt="Hero" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          {/* Title - benefit-oriented */}
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight opacity-0 animate-slide-up stagger-1"
          >
            {title}
          </h1>
          
          {/* Subtitle - what user gains */}
          <p className="text-lg md:text-xl text-muted-foreground mb-6 opacity-0 animate-slide-up stagger-2">
            {subtitle}
          </p>
          
          {/* Time estimate badge */}
          <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 mb-8 opacity-0 animate-slide-up stagger-3">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Leva menos de 1 minuto</span>
          </div>
          
          {/* Topics with Icons - horizontal on desktop, vertical on mobile */}
          {topics.length > 0 && (
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mb-10 opacity-0 animate-slide-up stagger-4">
              {topics.map((topic, index) => {
                const IconComponent = iconMap[topic.icon] || CheckCircle;
                return (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-full px-4 py-2 border border-border/50"
                  >
                    <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{topic.text}</span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Single CTA Button */}
          <div className="opacity-0 animate-slide-up stagger-5">
            <Button
              size="lg"
              onClick={onStart}
              className="typeform-button group text-lg px-10 py-7 h-auto rounded-full shadow-xl hover:shadow-2xl font-semibold min-w-[200px]"
            >
              {ctaText}
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
};
