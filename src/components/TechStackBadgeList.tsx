import { Layers, Terminal, Sparkles, ShieldCheck } from 'lucide-react';
import { TechStackItem } from '../types';

const techStack: TechStackItem[] = [
  { name: 'React', version: '19.0', role: 'UI Framework', category: 'Frontend' },
  { name: 'TypeScript', version: '5.8', role: 'Type Safety', category: 'Language' },
  { name: 'Vite', version: '6.2', role: 'Bundler & Dev Server', category: 'Tooling' },
  { name: 'Tailwind CSS', version: '4.1', role: 'Modern Styling', category: 'CSS' },
  { name: 'Lucide Icons', version: '0.546', role: 'Iconography', category: 'Assets' },
  { name: 'Motion', version: '12.23', role: 'Fluid Animations', category: 'Animation' }
];

export function TechStackBadgeList() {
  return (
    <div id="tech-stack-section" className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Runtime Environment & Stack</h2>
          <p className="text-sm text-stone-500">Configured runtime libraries and development setup</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-stone-600" />
          <span>Port 3000 Active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
        {techStack.map((tech) => (
          <div
            key={tech.name}
            id={`tech-badge-${tech.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            className="flex flex-col p-3 rounded-lg border border-stone-100 bg-stone-50/50 hover:border-stone-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">{tech.name}</span>
              <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                v{tech.version}
              </span>
            </div>
            <span className="text-[11px] text-stone-500 mt-1">{tech.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
