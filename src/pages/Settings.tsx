import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { StorageManager } from "@/lib/storage";
import type { AppSettings } from "@/types";
import { Save } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = StorageManager.get();
    setSettings(data.settings);
  }, []);

  const handleSave = () => {
    if (settings) {
      StorageManager.set('settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!settings) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your keys, preferences, and profile.</p>
      </header>

      <div className="max-w-2xl space-y-8">
        {/* API Configuration */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                    <input 
                        type="password"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="sk-..."
                        value={settings.openai_api_key || ''}
                        onChange={(e) => setSettings({...settings, openai_api_key: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Required for job analysis and resume tailoring. Key is stored locally in your browser.</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Personal Access Token (Optional)</label>
                    <input 
                        type="password"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="ghp_..."
                        value={settings.github_token || ''}
                        onChange={(e) => setSettings({...settings, github_token: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Increases rate limit for job scraping (60 -&gt; 5000 req/hr).</p>
                </div>
            </div>
        </section>

        {/* Preferences */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Preferences</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notifications</label>
                        <p className="text-xs text-gray-500">Enable system notifications for new jobs</p>
                    </div>
                    <input 
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={settings.notification_enabled}
                        onChange={(e) => setSettings({...settings, notification_enabled: e.target.checked})}
                    />
                </div>
            </div>
        </section>

        <div className="flex justify-end">
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-all"
            >
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Changes'}
            </button>
        </div>
      </div>
    </Layout>
  );
}
