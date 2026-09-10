import { useState } from 'react';
import { FileCode, Folder, FileText, CheckCircle2, Copy, Check } from 'lucide-react';
import { ProjectFile } from '../types';

const projectFiles: ProjectFile[] = [
  { name: 'src/App.tsx', path: '/src/App.tsx', type: 'file', description: 'Main React application root component', status: 'starter' },
  { name: 'src/main.tsx', path: '/src/main.tsx', type: 'file', description: 'React 19 DOM entry and StrictMode wrapper', status: 'configured' },
  { name: 'src/index.css', path: '/src/index.css', type: 'file', description: 'Global stylesheet with Tailwind CSS v4 setup', status: 'configured' },
  { name: 'package.json', path: '/package.json', type: 'file', description: 'Dependencies, scripts, and runtime specifications', status: 'configured' },
  { name: 'vite.config.ts', path: '/vite.config.ts', type: 'file', description: 'Vite build pipeline and alias configurations', status: 'configured' },
  { name: 'metadata.json', path: '/metadata.json', type: 'file', description: 'AI Studio app metadata and permissions manifest', status: 'configured' },
  { name: '.env.example', path: '/.env.example', type: 'file', description: 'Environment variable declarations and secrets guide', status: 'system' }
];

export function FileStructureViewer() {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(projectFiles[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div id="file-structure-viewer" className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Project File Structure</h2>
          <p className="text-sm text-stone-500">Inspecting files configured in your workspace</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Synchronized
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            <Folder className="w-3.5 h-3.5" />
            Project Files
          </div>
          <div className="space-y-1">
            {projectFiles.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  id={`file-btn-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-stone-900 text-white font-medium'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {file.name.endsWith('.tsx') || file.name.endsWith('.ts') ? (
                      <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`} />
                    ) : (
                      <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`} />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-stone-800 text-stone-300'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {file.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500">{selectedFile.path}</span>
              <button
                id="copy-file-path-btn"
                onClick={() => handleCopyPath(selectedFile.path)}
                className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 p-1 rounded hover:bg-stone-200/60 transition-colors"
                title="Copy relative path"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="sr-only">Copy path</span>
              </button>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">{selectedFile.name}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{selectedFile.description}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200/80 mt-4">
            <div className="text-[11px] text-stone-500">
              <span className="font-semibold text-stone-700">Status: </span>
              {selectedFile.status === 'configured'
                ? 'Compiled and ready for live rendering.'
                : selectedFile.status === 'starter'
                ? 'Primary target for your upcoming UI and logic.'
                : 'Project environment settings.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
