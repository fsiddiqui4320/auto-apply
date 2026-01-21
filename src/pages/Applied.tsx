import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { StorageManager } from "@/lib/storage";
import type { AppData } from "@/types";
import { Search } from "lucide-react";

export default function Applied() {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    setData(StorageManager.get());
  }, []);

  if (!data) return <Layout>Loading...</Layout>;

  const appliedJobs = data.jobs_table.filter(j => j.status === 'applied').sort((a, b) => 
      new Date(b.application_data?.submitted_at || 0).getTime() - new Date(a.application_data?.submitted_at || 0).getTime()
  );

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Application History</h1>
        <p className="text-gray-500 mt-1">Track your submitted applications.</p>
      </header>
    
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search applications..." className="text-sm outline-none w-full" />
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
                <tr>
                    <th className="p-4 text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="p-4 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="p-4 text-xs font-medium text-gray-500 uppercase">Applied Date</th>
                    <th className="p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
            </thead>
            <tbody>
                {appliedJobs.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No applications yet.</td></tr>
                ) : (
                    appliedJobs.map(job => (
                        <tr key={job.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                            <td className="p-4 font-medium">{job.company}</td>
                            <td className="p-4 text-gray-600">{job.role}</td>
                            <td className="p-4 text-gray-500 text-sm">
                                {job.application_data?.submitted_at ? new Date(job.application_data.submitted_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                                    Applied
                                </span>
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
