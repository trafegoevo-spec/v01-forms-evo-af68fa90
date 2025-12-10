import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CoverPageProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onStart: () => void;
}

export const CoverPage = ({ title, subtitle, ctaText, onStart }: CoverPageProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 animate-[pulse_8s_ease-in-out_infinite]" />
      
      {/* Floating orbs with staggered animations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-[float_8s_ease-in-out_infinite_reverse]" />
      <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-2xl animate-[float_7s_ease-in-out_infinite_1s]" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl animate-[float_9s_ease-in-out_infinite_2s]" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Content with staggered fade-in animations */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Title with slide-up animation */}
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight opacity-0 animate-[slideUp_0.8s_ease-out_0.2s_forwards]"
        >
          {title}
        </h1>
        
        {/* Subtitle with delayed slide-up animation */}
        <p 
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed opacity-0 animate-[slideUp_0.8s_ease-out_0.4s_forwards]"
        >
          {subtitle}
        </p>
        
        {/* CTA Button with delayed appearance and hover effects */}
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
  );
};
