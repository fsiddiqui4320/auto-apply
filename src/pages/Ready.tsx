import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { StorageManager } from "@/lib/storage";
import { ResumeTailor } from "@/lib/tailor";
import { PDFCompiler } from "@/lib/pdf";
import type { AppData, Job } from "@/types";
import { diffLines, type Change } from "diff";
import { Download, FileText, CheckCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Ready() {
  const [data, setData] = useState<AppData | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [generating, setGenerating] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [diffs, setDiffs] = useState<Change[]>([]);

  useEffect(() => {
    setData(StorageManager.get());
  }, []);

  const handleGenerateValues = async (job: Job) => {
    if (!job.analysis || !data?.master_resume) return;
    setGenerating(true);
    try {
        const tailoredLatex = await ResumeTailor.generateTailoredResume(job.analysis, data.master_resume);
        
        // Save
        StorageManager.updateListItem('jobs_table', job.id, { 
            resume_latex: tailoredLatex,
            status: 'resume_generated'
        });
        
        setData(StorageManager.get());
        setSelectedJob(prev => prev?.id === job.id ? { ...prev, resume_latex: tailoredLatex } as Job : prev);

    } catch (e: any) {
        alert("Generation failed: " + e.message);
    } finally {
        setGenerating(false);
    }
  };

  const handleCompile = async (job: Job) => {
      if (!job.resume_latex) return;
      setCompiling(true);
      try {
          const blob = await PDFCompiler.compile(job.resume_latex);
          // Store blob url or base64 (localStorage limit warning!)
          // For now, we generate URL on the fly or download immediately
          // Saving large B64 to LS is bad, but for MVP...
          
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64data = reader.result as string;
              StorageManager.updateListItem('jobs_table', job.id, { 
                  resume_pdf_blob: base64data
              });
              setData(StorageManager.get());
          }
          reader.readAsDataURL(blob);

      } catch (e: any) {
          alert("Compilation failed: " + e.message);
      } finally {
          setCompiling(false);
      }
  };

  useEffect(() => {
      if (selectedJob && selectedJob.resume_latex && data?.master_resume.latex_source) {
          const d = diffLines(data.master_resume.latex_source, selectedJob.resume_latex);
          setDiffs(d);
      }
  }, [selectedJob, data]);

  if (!data) return <Layout>Loading...</Layout>;

  // Jobs that are analyzed but not yet applied
  const readyJobs = data.jobs_table.filter(j => ['analysis_complete', 'resume_generated'].includes(j.status));

  return (
    <Layout>
      <div className="flex h-[calc(100vh-100px)] gap-6">
        {/* Left: Job List */}
        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
            <div className="p-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Ready to Apply</h2>
            </div>
            {readyJobs.map(job => (
                <div 
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={cn(
                        "p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                         selectedJob?.id === job.id && "bg-primary/5 border-l-4 border-l-primary"
                    )}
                >
                    <h3 className="font-medium text-gray-900">{job.company}</h3>
                    <p className="text-sm text-gray-600">{job.role}</p>
                    <div className="mt-2 flex gap-2">
                        {job.status === 'resume_generated' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Resume Ready</span>}
                    </div>
                </div>
            ))}
        </div>

        {/* Right: Workspace */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col overflow-y-auto">
            {selectedJob ? (
                <>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                             <h2 className="text-2xl font-bold text-gray-900">{selectedJob.company}</h2>
                             <p className="text-gray-500">{selectedJob.role}</p>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => handleGenerateValues(selectedJob)}
                                disabled={generating}
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                            >
                                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                {selectedJob.resume_latex ? 'Regenerate' : 'Generate Resume'}
                            </button>
                             {selectedJob.resume_latex && (
                                <button 
                                    onClick={() => handleCompile(selectedJob)}
                                    disabled={compiling}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    {compiling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                    Compile PDF
                                </button>
                             )}
                        </div>
                    </div>

                    {/* Diff View */}
                    {selectedJob.resume_latex ? (
                        <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50 font-mono text-xs overflow-auto">
                            {diffs.map((part, i) => (
                                <span 
                                    key={i} 
                                    className={cn(
                                        part.added ? "bg-green-100 text-green-800" : 
                                        part.removed ? "bg-red-100 text-red-800 line-through opacity-50" : 
                                        "text-gray-600"
                                    )}
                                >
                                    {part.value}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            Click "Generate Resume" to tailor your master resume for this role.
                        </div>
                    )}
                    
                    {/* PDF Preview/Download */}
                    {selectedJob.resume_pdf_blob && (
                         <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-2 text-green-800">
                                <CheckCircle className="w-5 h-5" />
                                <span>PDF Compiled Successfully</span>
                            </div>
                            <a 
                                href={selectedJob.resume_pdf_blob} 
                                download={`${selectedJob.company}_Resume.pdf`}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-50"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </a>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    Select a job to start the application process.
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
}
