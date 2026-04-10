import * as React from "react";
import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { analyzeExamPDF } from "@/lib/gemini";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import * as pdfjs from "pdfjs-dist";
import { toast } from "sonner";

// Set worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export default function AdminDashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus({ type: 'idle', message: 'Extracting text from PDF...' });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => (item as any).str).join(" ");
        fullText += pageText + "\n";
      }

      setStatus({ type: 'idle', message: 'Analyzing exam structure with AI...' });
      const examData = await analyzeExamPDF(fullText);
      
      setStatus({ type: 'idle', message: 'Saving to database...' });
      
      try {
        await addDoc(collection(db, "exams"), {
          ...examData,
          createdAt: serverTimestamp()
        });
        setStatus({ type: 'success', message: `Successfully parsed ${examData.title || 'Exam'}. Data saved to database.` });
        toast.success("Exam uploaded successfully!");
      } catch (dbError) {
        console.error("Firestore Error:", dbError);
        setStatus({ type: 'error', message: 'Failed to save to database. Check security rules.' });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus({ type: 'error', message: 'Failed to process PDF. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Upload and manage Cambridge exam materials.</p>
        </header>

        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle>Upload Exam PDF</CardTitle>
            <CardDescription>
              Upload a Cambridge sample paper (KET/PET/FCE) to automatically extract questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-slate-600 font-medium">{status.message}</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4">Drag and drop your PDF here, or click to browse</p>
                  <Input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileUpload}
                    className="max-w-xs cursor-pointer"
                  />
                </>
              )}
            </div>

            {status.type !== 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-lg flex items-start space-x-3 ${
                  status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
                <p className="font-medium">{status.message}</p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-sm">KET Sample Paper {i}.pdf</p>
                        <p className="text-xs text-slate-500">Uploaded 2 days ago</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded">KET</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Questions</span>
                  <span className="font-bold">1,248</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Active Students</span>
                  <span className="font-bold">85</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Speaking Sessions Today</span>
                  <span className="font-bold">42</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
