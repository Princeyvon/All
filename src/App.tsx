import { Terminal, Sparkles, ExternalLink, Activity, Play } from 'lucide-react';
import { FileStructureViewer } from './components/FileStructureViewer';
import { TechStackBadgeList } from './components/TechStackBadgeList';
import { GitHubStatusCard } from './components/GitHubStatusCard';

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-stone-200">
      {/* Top Navigation Bar */}
      <header id="main-header" className="border-b border-stone-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs tracking-wide">
              PW
            </div>
            <div>
              <h1 className="text-sm font-semibold text-stone-900 leading-tight">Project Workspace</h1>
              <p className="text-[11px] text-stone-500">Live Development Preview</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Container Live
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome / Status Banner */}
        <section id="welcome-banner" className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">
              <Activity className="w-3.5 h-3.5 text-stone-500" />
              Environment Ready
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
              Project Preview & Codebase
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Your development environment is active and serving on port 3000. All tooling, build pipelines, and React dependencies are initialized.
            </p>
          </div>
        </section>

        {/* GitHub Sync Status Card */}
        <GitHubStatusCard />

        {/* File Structure & Code Inspector */}
        <FileStructureViewer />

        {/* Tech Stack Matrix */}
        <TechStackBadgeList />

        {/* Footer with prompt helper */}
        <footer id="main-footer" className="text-center py-6 text-xs text-stone-500 border-t border-stone-200/80">
          Ready to build! Tell the AI coding assistant what you'd like to develop, and the UI will update dynamically.
        </footer>
      </main>
    </div>
  );
}
