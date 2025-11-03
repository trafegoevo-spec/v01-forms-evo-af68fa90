import { GraduationCap } from "lucide-react";
import { MultiStepForm } from "@/components/MultiStepForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Icon */}
      <div className="flex justify-center pt-12 mb-6">
        <div className="bg-blue-100 rounded-full p-6">
          <GraduationCap className="h-12 w-12 text-blue-600" />
        </div>
      </div>

      {/* Title Section */}
      <div className="text-center mb-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Comece Sua Jornada Educacional
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Preencha o formulário para receber mais informações sobre nossos cursos
        </p>
      </div>

      {/* Multi-Step Form */}
      <main className="container mx-auto px-4 pb-12">
        <MultiStepForm />
      </main>
    </div>
  );
};

export default Index;
