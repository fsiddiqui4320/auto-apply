import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { StorageManager } from "@/lib/storage";
import { JobAnalyzer } from "@/lib/analyzer";
import type { AppData, Job } from "@/types";
import { Sparkles, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Jobs() {
  const [data, setData] = useState<AppData | null>(null);
  const [analyzingMap, setAnalyzingMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(StorageManager.get());
  }, []);

  const handleAnalyze = async (job: Job) => {
    setAnalyzingMap(prev => ({ ...prev, [job.id]: true }));
    setError(null);

    try {
        // Update status to analyzing
        StorageManager.updateListItem('jobs_table', job.id, { status: 'analyzing' });
        setData(StorageManager.get());

        // 1. Fetch
        const html = await JobAnalyzer.fetchJobContent(job.url);
        
        // 2. Analyze
        const analysis = await JobAnalyzer.analyze(html);

        // 3. Save
        StorageManager.updateListItem('jobs_table', job.id, { 
            status: 'analysis_complete',
            analysis: analysis
        });
        
        // Log
        // const currentData = StorageManager.get(); // Refresh
        StorageManager.updateListItem('activity_log', 'new-entry', { // Workaround: append logic needed in storage manage for log
             // For now we will rely on a future improved storage manager or just simple state update
             // We can manually push to log in component for now
        } as any);

        setData(StorageManager.get());

    } catch (e: any) {
        console.error("Analysis failed", e);
        setError(e.message);
        StorageManager.updateListItem('jobs_table', job.id, { 
            status: 'failed',
            error: e.message
        });
        setData(StorageManager.get());
    } finally {
        setAnalyzingMap(prev => ({ ...prev, [job.id]: false }));
    }
  };

  if (!data) return <Layout>Loading...</Layout>;

  // Filter for new or analyzing or analysis complete (not applied/skipped/ready)
  // Actually, "New Jobs" usually implies inbox.
  const jobs = data.jobs_table.filter(j => ['new', 'analyzing', 'failed'].includes(j.status));

  return (
    <Layout>
       <header className="mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">New Jobs</h1>
           <p className="text-gray-500 mt-1">Found {jobs.length} new opportunities.</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                    <th className="p-4 font-medium text-gray-500 text-sm">Company</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Role</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Location</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Date Found</th>
                    <th className="p-4 font-medium text-gray-500 text-sm text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {jobs.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">
                            No new jobs found. Check back later!
                        </td>
                    </tr>
                ) : (
                    jobs.map(job => (
                        <tr key={job.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-medium text-gray-900">{job.company}</td>
                            <td className="p-4 text-gray-600">{job.role}</td>
                            <td className="p-4 text-gray-500">{job.location}</td>
                            <td className="p-4 text-gray-500 text-sm">{new Date(job.created_at).toLocaleDateString()}</td>
                            <td className="p-4 text-right flex items-center justify-end gap-2">
                                <a 
                                    href={job.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="View Job"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button 
                                    onClick={() => handleAnalyze(job)}
                                    disabled={analyzingMap[job.id]}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        job.status === 'failed' 
                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    )}
                                >
                                    {analyzingMap[job.id] ? (
                                        <>
                                            <RefreshCw className="w-3 h-3 animate-spin api-loading" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3 h-3" />
                                            {job.status === 'failed' ? 'Retry Analysis' : 'Analyze'}
                                        </>
                                    )}
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </Layout>
  );
}
