import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-white text-slate-500 py-16 sm:py-24 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg leading-none">S</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">StockIN</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-8">
              A simple, modern business management platform that helps businesses manage inventory, billing, sales, customers, and operations from one place.
            </p>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Built by</span>
              <a href="https://auraforge.site" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 group">
                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">AuraForge</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm hover:text-blue-600 transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm hover:text-blue-600 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="https://auraforge.site" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-blue-600 transition-colors">AuraForge</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Legal & Auth</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy-policy" className="text-sm hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-sm hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              <li><Link to="/login" className="text-sm hover:text-blue-600 font-medium transition-colors">Log In / Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} StockIN. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            Built with <span className="text-amber-500">⚡</span> by{' '}
            <a href="https://auraforge.site" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 hover:text-blue-600 transition-colors">
              AuraForge
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
