import Sidebar from './Sidebar';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-emerald-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <input placeholder="Search projects..." className="border px-3 py-2 rounded-md" />
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">🔔</div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">U</div>
          </div>
        </header>
        <main>{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
