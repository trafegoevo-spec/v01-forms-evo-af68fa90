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
  gradientStyle?: React.CSSProperties;
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

export const CoverPage = ({ title, subtitle, topics, ctaText, onStart, gradientStyle }: CoverPageProps) => {

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={gradientStyle}>
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 animate-[pulse_8s_ease-in-out_infinite]" />
      
      {/* Floating orbs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-[float_8s_ease-in-out_infinite_reverse]" />
      
      {/* Centered Content Section */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 leading-tight opacity-0 animate-[slideUp_0.8s_ease-out_0.2s_forwards]"
          >
            {title}
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 opacity-0 animate-[slideUp_0.8s_ease-out_0.3s_forwards]">
            {subtitle}
          </p>
          
          {/* Topics with Icons */}
          {topics.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10 opacity-0 animate-[slideUp_0.8s_ease-out_0.4s_forwards]">
              {topics.map((topic, index) => {
                const IconComponent = iconMap[topic.icon] || CheckCircle;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">{topic.text}</span>
                    {index < topics.length - 1 && (
                      <span className="text-muted-foreground/50 ml-2">|</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
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
            
            {/* Estimated time */}
            <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground opacity-0 animate-[slideUp_0.8s_ease-out_0.7s_forwards]">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Tempo estimado: 45 segundos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
