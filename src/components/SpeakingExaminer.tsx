import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, SkipForward, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { getSpeakingFeedback } from "@/lib/gemini";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

interface SpeakingExaminerProps {
  level: string;
  onComplete: (report: any) => void;
}

export default function SpeakingExaminer({ level, onComplete }: SpeakingExaminerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentPart, setCurrentPart] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Mock questions based on level
    const mockQuestions = level === 'KET' 
      ? ["What's your name?", "Where do you live?", "Do you like studying English? Why?", "Tell me about your family."]
      : ["Can you describe your hometown?", "What do you like to do in your free time?", "How important is learning English for your future?", "Tell me about a memorable holiday you had."];
    
    setQuestions(mockQuestions);

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + " " + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };
    }
  }, [level]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setTimer(0);
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const handleNextQuestion = async () => {
    if (transcript.length < 10) {
      alert("Please speak a bit more before moving to the next question.");
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTranscript("");
      setTimer(0);
    } else {
      // Analyze final results
      setIsAnalyzing(true);
      try {
        const result = await getSpeakingFeedback(transcript, `Part ${currentPart}`, "Grammar, Vocabulary, Pronunciation, Communication");
        setFeedback(result);

        // Save session to Firestore
        if (auth.currentUser) {
          await addDoc(collection(db, "sessions"), {
            userId: auth.currentUser.uid,
            level: level,
            mode: "speaking",
            score: result.score,
            feedback: result,
            timestamp: serverTimestamp()
          });
          toast.success("Session saved to your history.");
        }
      } catch (error) {
        console.error("Analysis error:", error);
        toast.error("Failed to save session.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-6 bg-slate-50 flex items-center justify-center">
      <div className="max-w-3xl w-full">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Speaking Examiner (AI)</h1>
            <p className="text-slate-600">{level} Speaking Part {currentPart}</p>
          </div>
          <Badge variant="outline" className="text-lg py-1 px-3">
            Question {currentQuestionIndex + 1} / {questions.length}
          </Badge>
        </header>

        <AnimatePresence mode="wait">
          {!feedback ? (
            <motion.div
              key="exam"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-6 overflow-hidden border-2 border-blue-100">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                  <CardTitle className="text-xl flex items-center text-blue-800">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Examiner asks:
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-2xl font-medium text-slate-800 italic">
                    "{questions[currentQuestionIndex]}"
                  </p>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <motion.div
                        animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                          isRecording ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-slate-200'
                        }`}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-full h-full rounded-full hover:bg-transparent"
                          onClick={toggleRecording}
                        >
                          {isRecording ? <MicOff className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-slate-500" />}
                        </Button>
                      </motion.div>
                      {isRecording && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-red-500 font-bold animate-pulse">
                          {formatTime(timer)}
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-slate-100 p-4 rounded-lg min-h-[120px] border border-slate-200">
                      <p className="text-slate-500 text-sm mb-2 uppercase font-bold tracking-wider">Your Transcript:</p>
                      <p className="text-slate-800 leading-relaxed">
                        {transcript || (isRecording ? "Listening..." : "Click the microphone to start speaking...")}
                      </p>
                    </div>

                    <div className="flex space-x-4 w-full">
                      <Button 
                        className="flex-1 h-12 text-lg" 
                        onClick={handleNextQuestion}
                        disabled={isRecording || isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                        ) : (
                          currentQuestionIndex < questions.length - 1 ? <><SkipForward className="mr-2 h-5 w-5" /> Next Question</> : <><CheckCircle2 className="mr-2 h-5 w-5" /> Finish & Get Feedback</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-2 border-green-200">
                <CardHeader className="bg-green-50 border-b border-green-100">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl text-green-800">Performance Report</CardTitle>
                    <div className="text-3xl font-bold text-green-600">Score: {feedback.score}/5</div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Overall Feedback</h3>
                    <p className="text-slate-700 leading-relaxed">{feedback.feedback}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h4 className="font-bold text-green-800 mb-2 flex items-center">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Strengths
                      </h4>
                      <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                        {feedback.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <h4 className="font-bold text-amber-800 mb-2 flex items-center">
                        <Loader2 className="mr-2 h-4 w-4" /> Suggestions
                      </h4>
                      <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                        {feedback.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>

                  <Button className="w-full h-12 text-lg" onClick={() => onComplete(feedback)}>
                    Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
