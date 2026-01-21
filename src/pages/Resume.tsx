import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { StorageManager } from "@/lib/storage";
import type { MasterResume } from "@/types";
import { Save, FileText } from "lucide-react";

const DEFAULT_TEMPLATE = `
\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{left=1cm,right=1cm,top=1cm,bottom=1cm}

\\begin{document}
\\section*{Name}
Software Engineer
\\end{document}
`;

export default function Resume() {
  const [resume, setResume] = useState<MasterResume | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = StorageManager.get();
    if (!data.master_resume.latex_source) {
        // Initialize if empty
        data.master_resume.latex_source = DEFAULT_TEMPLATE;
    }
    setResume(data.master_resume);
  }, []);

  const handleSave = () => {
    if (resume) {
      StorageManager.set('master_resume', {
          ...resume,
          last_modified: new Date().toISOString()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!resume) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <header className="mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Master Resume</h1>
           <p className="text-gray-500 mt-1">Edit your base LaTeX template. The AI will modify this for each job.</p>
        </div>
        <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-all"
        >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>latex_source.tex</span>
            <span className="text-gray-400 ml-auto text-xs">Last modified: {new Date(resume.last_modified).toLocaleString()}</span>
        </div>
        <textarea
            className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none"
            value={resume.latex_source}
            onChange={(e) => setResume({...resume, latex_source: e.target.value})}
            spellCheck={false}
        />
      </div>
    </Layout>
  );
}
