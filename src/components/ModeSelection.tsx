import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, MessageSquare, BookOpen, PenTool, ClipboardCheck, ArrowLeft } from "lucide-react";
import { ExamLevel } from "@/types";

interface ModeSelectionProps {
  level: ExamLevel;
  onSelectMode: (mode: string) => void;
  onBack: () => void;
}

export default function ModeSelection({ level, onSelectMode, onBack }: ModeSelectionProps) {
  const modes = [
    { id: 'listening', title: 'Listening', icon: Headphones, color: 'bg-blue-100 text-blue-600' },
    { id: 'speaking', title: 'Speaking', icon: MessageSquare, color: 'bg-green-100 text-green-600' },
    { id: 'reading', title: 'Reading', icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
    { id: 'writing', title: 'Writing', icon: PenTool, color: 'bg-orange-100 text-orange-600' },
    { id: 'full', title: 'Full Test', icon: ClipboardCheck, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-4xl mb-8"
      >
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">{level} Practice</h1>
        <p className="text-slate-600">Select a skill to focus on or take a full mock exam.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {modes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
              onClick={() => onSelectMode(mode.id)}
            >
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <div className={`p-3 rounded-xl ${mode.color}`}>
                  <mode.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{mode.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  Practice {mode.title.toLowerCase()} skills with AI feedback.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
