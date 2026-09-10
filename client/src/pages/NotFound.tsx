import React from "react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xs border border-stone-200">
        <h1 className="text-4xl font-bold text-stone-900 mb-2 font-mono">404</h1>
        <p className="text-stone-500 mb-6 text-sm">Page not found in this dashboard.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-lime-400 text-stone-950 font-medium text-sm transition-transform active:scale-[0.98]"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
