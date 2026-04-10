/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Onboarding from "@/components/Onboarding";
import ModeSelection from "@/components/ModeSelection";
import AdminDashboard from "@/components/AdminDashboard";
import SpeakingExaminer from "@/components/SpeakingExaminer";
import { ExamLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, LogIn, User as UserIcon } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { auth, signInWithGoogle, logout, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

type AppState = 'onboarding' | 'mode-selection' | 'practice' | 'admin';

export default function App() {
  const [state, setState] = useState<AppState>('onboarding');
  const [selectedLevel, setSelectedLevel] = useState<ExamLevel | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check user role in Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === 'admin');
        } else {
          // Create new user profile
          const isDefaultAdmin = currentUser.email === "khanhckm060@gmail.com";
          await setDoc(doc(db, "users", currentUser.uid), {
            uid: currentUser.uid,
            email: currentUser.email,
            role: isDefaultAdmin ? 'admin' : 'student',
            displayName: currentUser.displayName
          });
          setIsAdmin(isDefaultAdmin);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectLevel = (level: ExamLevel) => {
    setSelectedLevel(level);
    setState('mode-selection');
  };

  const handleSelectMode = (mode: string) => {
    setSelectedMode(mode);
    setState('practice');
  };

  const handleBackToLevels = () => {
    setState('onboarding');
    setSelectedLevel(null);
  };

  const handleBackToModes = () => {
    setState('mode-selection');
    setSelectedMode(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Cambridge Exam Master</h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Your personal AI-powered tutor for KET, PET, and FCE exams. 
            Sign in to track your progress and get personalized feedback.
          </p>
        </div>
        <Button size="lg" onClick={signInWithGoogle} className="px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
          <LogIn className="mr-2 h-6 w-6" /> Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <nav className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        {isAdmin && (
          <Button 
            variant="outline" 
            size="icon" 
            className={`rounded-full bg-white shadow-sm ${state === 'admin' ? 'border-blue-600 text-blue-600' : ''}`}
            onClick={() => setState(state === 'admin' ? 'onboarding' : 'admin')}
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center bg-white border rounded-full px-3 py-1 shadow-sm">
          <UserIcon className="h-4 w-4 text-slate-500 mr-2" />
          <span className="text-sm font-medium text-slate-700 mr-3 hidden sm:inline">
            {user.displayName}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={logout}>
            <LogOut className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      </nav>

      <main>
        {state === 'onboarding' && (
          <Onboarding onSelectLevel={handleSelectLevel} />
        )}

        {state === 'mode-selection' && selectedLevel && (
          <ModeSelection 
            level={selectedLevel} 
            onSelectMode={handleSelectMode} 
            onBack={handleBackToLevels} 
          />
        )}

        {state === 'practice' && selectedLevel && selectedMode === 'speaking' && (
          <SpeakingExaminer 
            level={selectedLevel} 
            onComplete={() => setState('mode-selection')} 
          />
        )}

        {state === 'practice' && selectedLevel && selectedMode !== 'speaking' && (
          <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedMode?.toUpperCase()} Practice</h2>
            <p className="text-slate-600 mb-8">This module is currently being populated with content from the database.</p>
            <Button onClick={handleBackToModes}>Back to Modes</Button>
          </div>
        )}

        {state === 'admin' && isAdmin && (
          <AdminDashboard />
        )}
      </main>
      <Toaster />
    </div>
  );
}


