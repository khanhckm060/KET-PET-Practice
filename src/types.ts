export type ExamLevel = 'KET' | 'PET' | 'FCE';

export type ExamPart = {
  id: string;
  title: string;
  instructions: string;
  type: 'reading' | 'writing' | 'listening' | 'speaking';
  questions: Question[];
};

export type Question = {
  id: string;
  text: string;
  options?: string[];
  correctAnswer?: string;
  type: 'multiple-choice' | 'open-ended' | 'matching' | 'gap-fill';
  image?: string;
  audio?: string;
};

export type ExamSession = {
  id: string;
  level: ExamLevel;
  mode: 'listening' | 'speaking' | 'reading' | 'writing' | 'full';
  startTime: number;
  endTime?: number;
  answers: Record<string, string>;
  score?: number;
  feedback?: string;
};

export type UserRole = 'student' | 'admin';
