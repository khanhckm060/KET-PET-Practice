import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExamLevel } from "@/types";

interface OnboardingProps {
  onSelectLevel: (level: ExamLevel) => void;
}

export default function Onboarding({ onSelectLevel }: OnboardingProps) {
  const levels: { id: ExamLevel; title: string; description: string; status?: string }[] = [
    { id: 'KET', title: 'KET (A2 Key)', description: 'Basic level English for everyday situations.' },
    { id: 'PET', title: 'PET (B1 Preliminary)', description: 'Intermediate level English for practical use.' },
    { id: 'FCE', title: 'FCE (B2 First)', description: 'Upper-intermediate level English for work or study.', status: 'Coming Soon' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Cambridge Exam Master</h1>
        <p className="text-lg text-slate-600">Choose your level to start practicing</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        {levels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`h-full flex flex-col transition-all hover:shadow-lg ${level.status ? 'opacity-75 grayscale' : 'hover:-translate-y-1 cursor-pointer'}`}
              onClick={() => !level.status && onSelectLevel(level.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl font-bold">{level.id}</CardTitle>
                  {level.status && (
                    <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-1 rounded">
                      {level.status}
                    </span>
                  )}
                </div>
                <CardDescription className="text-lg font-medium text-slate-700">
                  {level.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-slate-500">{level.description}</p>
              </CardContent>
              <CardContent className="pt-0">
                <Button 
                  className="w-full" 
                  disabled={!!level.status}
                  variant={level.status ? "outline" : "default"}
                >
                  {level.status ? "Locked" : "Select Level"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
