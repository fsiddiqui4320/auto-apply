import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { StorageManager } from "@/lib/storage";
import { GitHubScraper } from "@/lib/scraper";
import { AppData } from "@/types";
import { RefreshCw, Play, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load initial data
    StorageManager.init();
    setData(StorageManager.get());
  }, []);

  const handleCheckJobs = async () => {
    setLoading(true);
    await GitHubScraper.fetchJobs();
    setData(StorageManager.get()); // Refresh
    setLoading(false);
  };

  if (!data) return <div>Loading...</div>;

  const stats = [
    { label: "New Jobs", value: data.jobs_table.filter(j => j.status === 'new').length, icon: Play, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Ready to Apply", value: data.jobs_table.filter(j => j.status === 'resume_generated').length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Applied", value: data.jobs_table.filter(j => j.status === 'applied').length, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Failed", value: data.jobs_table.filter(j => j.status === 'failed').length, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <Layout>
      <header className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
           <p className="text-gray-500 mt-1">Welcome back. Here's your application overview.</p>
        </div>
        <button 
            onClick={handleCheckJobs}
            disabled={loading}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
        >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {loading ? 'Checking...' : 'Check for New Jobs'}
        </button>
      </header>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-xl", stat.bg)}>
                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                    <span className="text-4xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <h3 className="text-gray-500 font-medium">{stat.label}</h3>
            </div>
        ))}
      </div>

      {/* Recent Activity */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-6">
            {data.activity_log.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity.</p>
            ) : (
                data.activity_log.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="mt-1 p-2 bg-gray-50 rounded-full">
                            <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-gray-900 font-medium">{log.details}</p>
                            <p className="text-sm text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </section>
    </Layout>
  );
}
