import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { StorageManager } from "@/lib/storage";
import { ResumeTailor } from "@/lib/tailor";
import { PDFCompiler } from "@/lib/pdf";
import type { AppData, Job } from "@/types";
import { diffLines, type Change } from "diff";
import { Download, FileText, CheckCircle, RefreshCw, PenTool, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Ready() {
  const [data, setData] = useState<AppData | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [generating, setGenerating] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [genCL, setGenCL] = useState(false);
  const [diffs, setDiffs] = useState<Change[]>([]);

  useEffect(() => {
    setData(StorageManager.get());
  }, []);

  const handleGenerateValues = async (job: Job) => {
    if (!job.analysis || !data?.master_resume) return;
    setGenerating(true);
    try {
        const tailoredLatex = await ResumeTailor.generateTailoredResume(job.analysis, data.master_resume);
        
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

  const handleGenerateCL = async (job: Job) => {
      if (!job.analysis) return;
      setGenCL(true);
      try {
          const cl = await ResumeTailor.generateCoverLetter(job.analysis);
          StorageManager.updateListItem('jobs_table', job.id, {  cover_letter: cl });
          setData(StorageManager.get());
           setSelectedJob(prev => prev?.id === job.id ? { ...prev, cover_letter: cl } as Job : prev);
      } catch (e: any) {
          alert("CL Generation failed: " + e.message);
      } finally {
          setGenCL(false);
      }
  };

  const handleCompile = async (job: Job) => {
      if (!job.resume_latex) return;
      setCompiling(true);
      try {
          const blob = await PDFCompiler.compile(job.resume_latex);
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64data = reader.result as string;
              StorageManager.updateListItem('jobs_table', job.id, { resume_pdf_blob: base64data });
              setData(StorageManager.get());
              setSelectedJob(prev => prev?.id === job.id ? { ...prev, resume_pdf_blob: base64data } as Job : prev);
          }
          reader.readAsDataURL(blob);
      } catch (e: any) {
          alert("Compilation failed: " + e.message);
      } finally {
          setCompiling(false);
      }
  };
  
  const markApplied = (job: Job) => {
      if (confirm('Mark this job as Applied?')) {
          StorageManager.updateListItem('jobs_table', job.id, { 
              status: 'applied',
              application_data: { submitted_at: new Date().toISOString() }
          });
          StorageManager.updateListItem('activity_log', 'new', { // Assuming updateListItem handles new if needed, or we implement addLog
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              action: 'application_submitted',
              details: `Applied to ${job.company}`,
              status: 'success'
          } as any);

          setData(StorageManager.get());
          setSelectedJob(null);
      }
  }

  useEffect(() => {
      if (selectedJob && selectedJob.resume_latex && data?.master_resume.latex_source) {
          const d = diffLines(data.master_resume.latex_source, selectedJob.resume_latex);
          setDiffs(d);
      }
  }, [selectedJob, data]);

  if (!data) return <Layout>Loading...</Layout>;

  // Filter jobs
  const readyJobs = data.jobs_table.filter(j => ['analysis_complete', 'resume_generated'].includes(j.status));

  return (
    <Layout>
      <div className="flex h-[calc(100vh-100px)] gap-6">
        {/* Left: Job List */}
        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 sticky top-0 backdrop-blur-sm">
                <h2 className="font-bold text-gray-900">Ready to Apply ({readyJobs.length})</h2>
            </div>
            {readyJobs.length === 0 && <p className="p-4 text-gray-400 text-sm">No jobs ready. Go analyze some jobs first!</p>}
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
                    <div className="mt-2 flex gap-2 flex-wrap">
                        {job.status === 'resume_generated' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Resume Ready</span>}
                        {job.cover_letter && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">CL Ready</span>}
                    </div>
                </div>
            ))}
        </div>

        {/* Right: Workspace */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col overflow-y-auto">
            {selectedJob ? (
                <>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
                        <div>
                             <h2 className="text-2xl font-bold text-gray-900">{selectedJob.company}</h2>
                             <p className="text-gray-500">{selectedJob.role}</p>
                             <div className="flex gap-2 mt-2">
                                <a href={selectedJob.url} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                    View Posting <ExternalLink className="w-3 h-3" />
                                </a>
                             </div>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => markApplied(selectedJob)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm shadow-green-200"
                            >
                                Mark as Applied
                            </button>
                        </div>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                         {/* Resume Card */}
                         <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Resume
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <button 
                                    onClick={() => handleGenerateValues(selectedJob)}
                                    disabled={generating}
                                    className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"
                                >
                                    {generating ? 'Generating...' : selectedJob.resume_latex ? 'Regenerate Latex' : 'Generate Latex'}
                                </button>
                                {selectedJob.resume_latex && (
                                    <button 
                                        onClick={() => handleCompile(selectedJob)}
                                        disabled={compiling}
                                        className="text-xs bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800"
                                    >
                                        {compiling ? 'Compiling...' : 'Compile PDF'}
                                    </button>
                                )}
                            </div>
                            {selectedJob.resume_pdf_blob && (
                                <a 
                                    href={selectedJob.resume_pdf_blob} 
                                    download={`${selectedJob.company}_Resume.pdf`}
                                    className="flex items-center gap-2 text-sm text-green-700"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Download PDF Ready
                                </a>
                            )}
                         </div>

                         {/* Cover Letter Card */}
                         <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <PenTool className="w-4 h-4" /> Cover Letter
                            </h3>
                             <div className="flex flex-wrap gap-2 mb-3">
                                <button 
                                    onClick={() => handleGenerateCL(selectedJob)}
                                    disabled={genCL}
                                    className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"
                                >
                                    {genCL ? 'Drafting...' : selectedJob.cover_letter ? 'Regenerate Draft' : 'Draft Cover Letter'}
                                </button>
                            </div>
                            {selectedJob.cover_letter && (
                                <p className="text-xs text-green-700 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Draft Available
                                </p>
                            )}
                         </div>
                    </div>

                    {/* Content Editors */}
                    <div className="space-y-6">
                        {/* Resume Diff */}
                        {selectedJob.resume_latex && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Resume Changes</h4>
                                <div className="h-64 border border-gray-200 rounded-lg p-4 bg-gray-50 font-mono text-xs overflow-auto">
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
                            </div>
                        )}

                        {/* Cover Letter Editor */}
                        {selectedJob.cover_letter && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Cover Letter Draft</h4>
                                <textarea 
                                    className="w-full h-64 p-4 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={selectedJob.cover_letter}
                                    onChange={(e) => {
                                        const newVal = e.target.value;
                                        setSelectedJob({ ...selectedJob, cover_letter: newVal });
                                        StorageManager.updateListItem('jobs_table', selectedJob.id, { cover_letter: newVal });
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    Select a job to prepare your application.
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
}
