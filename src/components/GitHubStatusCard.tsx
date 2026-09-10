import { GitBranch, ArrowUpRight, ExternalLink, Info } from 'lucide-react';

export function GitHubStatusCard() {
  return (
    <div id="github-status-card" className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
          <GitBranch className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-stone-900">GitHub Repository Sync</h2>
            <span className="inline-flex items-center text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
              Export Ready
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 leading-relaxed">
            This workspace is hosted directly inside the AI Studio development container. You can export and sync this code to your personal GitHub account at any time.
          </p>

          <div className="mt-4 rounded-lg bg-stone-50 border border-stone-100 p-3.5 text-xs text-stone-600 space-y-2">
            <div className="flex items-start gap-2 font-medium text-stone-800">
              <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <span>How to push this project to GitHub:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-stone-600">
              <li>Click the <strong>Export</strong> button in the top menu of Google AI Studio.</li>
              <li>Select <strong>Export to GitHub</strong>.</li>
              <li>Authenticate with your GitHub account and choose your repository name.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
