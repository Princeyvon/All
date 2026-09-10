export interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  description: string;
  status: 'configured' | 'starter' | 'system';
}

export interface TechStackItem {
  name: string;
  version: string;
  role: string;
  category: string;
}
