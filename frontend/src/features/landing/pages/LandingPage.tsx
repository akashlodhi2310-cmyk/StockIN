import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LandingNavbar } from '../components/LandingNavbar';
import { LandingFooter } from '../components/LandingFooter';
import { useAuth } from '@/context/AuthContext';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { AlertTriangle, ArrowRight, BarChart3, Box, CheckCircle2, ChevronRight, FileText, Settings, ShieldCheck, Users } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isMasterAdmin } = useAuth();
  const { config } = usePlatformControl();

  useEffect(() => {
    if (user) {
      if (isMasterAdmin) {
        navigate('/master-admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isMasterAdmin, navigate]);

  if (config.maintenance_mode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <LandingNavbar />
        <main className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">System Maintenance</h1>
            <p className="text-slate-500 mb-6 text-sm">
              {config.maintenance_message || "We are currently optimizing our systems. Please check back shortly."}
            </p>
            <Link
              to="/login"
              className="inline-block bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm py-2 px-4 rounded-md border border-slate-300 transition-colors"
            >
              Admin Access
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const features = [
    { icon: <Box className="text-blue-600" size={24} />, title: 'Smart Inventory', desc: 'Real-time stock tracking across multiple warehouses with automated low-stock alerts.' },
    { icon: <FileText className="text-blue-600" size={24} />, title: 'GST Compliant Billing', desc: 'Generate professional invoices, quotations, and e-way bills with one click.' },
    { icon: <Users className="text-blue-600" size={24} />, title: 'Customer Management', desc: 'Maintain detailed client ledgers, payment histories, and outstanding balances.' },
    { icon: <BarChart3 className="text-blue-600" size={24} />, title: 'Financial Analytics', desc: 'Understand your cash flow, profit margins, and sales velocity instantly.' },
    { icon: <ShieldCheck className="text-blue-600" size={24} />, title: 'Enterprise Security', desc: 'Bank-grade encryption, automated backups, and granular role-based access.' },
    { icon: <Settings className="text-blue-600" size={24} />, title: 'Customizable Workflows', desc: 'Tailor the platform to match your exact business operational requirements.' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <LandingNavbar />

      <main>
        {/* HERO SECTION - Enterprise SaaS Style */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-8 hover:bg-blue-100 transition-colors">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              StockIN v3.2 is now live
              <ChevronRight size={14} />
            </Link>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-[1.1]">
              The intelligent operating system for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">business.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Consolidate your inventory, billing, and accounting into one powerful platform. Built for modern enterprises that demand speed, reliability, and precision.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                Start your free trial
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 px-8 py-3.5 rounded-lg font-semibold transition-all border border-slate-200 shadow-sm flex items-center justify-center"
              >
                Sign in to Dashboard
              </Link>
            </div>
            
            <p className="mt-5 text-sm text-slate-500">No credit card required. 14-day free trial.</p>
          </div>

          {/* High-Fidelity Dashboard Preview */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-20 relative z-20">
            <div className="rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
              {/* Fake Browser Header */}
              <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                </div>
                <div className="mx-auto bg-white border border-slate-200 rounded-md h-7 w-64 flex items-center justify-center text-[10px] text-slate-400 font-medium font-mono">
                  app.stockin.com
                </div>
              </div>
              
              {/* Fake App Layout */}
              <div className="flex h-[400px] md:h-[600px] bg-slate-50">
                {/* Sidebar */}
                <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col py-6 px-4">
                  <div className="h-8 bg-slate-100 rounded mb-8 w-3/4" />
                  <div className="space-y-2">
                    <div className="h-10 bg-blue-50 border border-blue-100 rounded-lg w-full" />
                    <div className="h-10 hover:bg-slate-50 rounded-lg w-full" />
                    <div className="h-10 hover:bg-slate-50 rounded-lg w-full" />
                    <div className="h-10 hover:bg-slate-50 rounded-lg w-full" />
                  </div>
                </div>
                {/* Main Content */}
                <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 overflow-hidden">
                  {/* Top Bar */}
                  <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                    <div className="w-48 h-8 bg-slate-200 rounded-lg" />
                    <div className="w-32 h-10 bg-blue-600 rounded-lg shadow-sm" />
                  </div>
                  
                  {/* Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm h-32 flex flex-col justify-between">
                      <div className="w-24 h-4 bg-slate-100 rounded" />
                      <div className="w-32 h-8 bg-slate-800 rounded" />
                    </div>
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm h-32 flex flex-col justify-between">
                      <div className="w-24 h-4 bg-slate-100 rounded" />
                      <div className="w-24 h-8 bg-slate-800 rounded" />
                    </div>
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm h-32 flex flex-col justify-between">
                      <div className="w-24 h-4 bg-slate-100 rounded" />
                      <div className="w-20 h-8 bg-slate-800 rounded" />
                    </div>
                  </div>
                  
                  {/* Large Chart Area */}
                  <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex-1 flex flex-col">
                    <div className="w-48 h-5 bg-slate-100 rounded mb-8" />
                    {/* Fake Chart Lines */}
                    <div className="flex-1 border-b border-l border-slate-100 relative">
                      <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-between px-4 pb-2">
                         <div className="w-[10%] h-[30%] bg-blue-100 rounded-t-sm" />
                         <div className="w-[10%] h-[50%] bg-blue-200 rounded-t-sm" />
                         <div className="w-[10%] h-[40%] bg-blue-300 rounded-t-sm" />
                         <div className="w-[10%] h-[70%] bg-blue-400 rounded-t-sm" />
                         <div className="w-[10%] h-[60%] bg-blue-500 rounded-t-sm" />
                         <div className="w-[10%] h-[90%] bg-blue-600 rounded-t-sm shadow-lg shadow-blue-500/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOGO CLOUD (Trust indicators) */}
        <section className="py-12 border-y border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-8">Trusted by forward-thinking businesses</p>
            <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-50 grayscale">
               <div className="text-xl font-bold font-serif">Acme Corp</div>
               <div className="text-xl font-black">GLOBEX</div>
               <div className="text-xl font-semibold italic">Soylent</div>
               <div className="text-xl font-bold tracking-widest">INITECH</div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Everything you need to scale</h2>
              <p className="text-lg text-slate-500">
                Replace a dozen different tools with one cohesive platform. StockIN provides a seamless experience from inventory receiving to final customer billing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feat, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Simple, transparent pricing</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">No hidden fees, no complex tiers. Choose the plan that fits your business size.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
              
              {/* Standard */}
              <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm relative flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Standard</h3>
                <p className="text-slate-500 mb-8">Perfect for small retail stores and single-user operations.</p>
                <div className="mb-8 flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-slate-900">₹999</span>
                  <span className="text-slate-500 font-medium mb-2">/month</span>
                </div>
                <div className="space-y-4 mb-10 flex-1">
                  {['1 User Account', 'Basic Inventory Tracking', 'Up to 500 Invoices/mo', 'Standard Reports', 'Email Support'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <CheckCircle2 className="text-blue-500 w-5 h-5 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link
                  to="/register"
                  className="block w-full text-center px-6 py-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-900 font-bold transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Professional */}
              <div className="bg-white rounded-3xl p-8 md:p-10 border-2 border-blue-600 shadow-xl relative flex flex-col transform md:-translate-y-4">
                <div className="absolute -top-4 right-8 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
                <p className="text-slate-500 mb-8">For growing businesses needing advanced capabilities.</p>
                <div className="mb-8 flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-slate-900">₹2499</span>
                  <span className="text-slate-500 font-medium mb-2">/month</span>
                </div>
                <div className="space-y-4 mb-10 flex-1">
                  {['Unlimited Users', 'Multi-warehouse Inventory', 'Unlimited GST Invoices', 'Advanced Analytics & Exports', 'Priority 24/7 Support'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <CheckCircle2 className="text-blue-600 w-5 h-5 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link
                  to="/register"
                  className="block w-full text-center px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm"
                >
                  Get Started Now
                </Link>
              </div>

            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-24 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-100/50 rounded-full blur-[100px] -z-10" />
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Ready to streamline your business?</h2>
            <p className="text-slate-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of businesses managing their inventory, customers, and cash flow on StockIN today.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5"
            >
              Create Free Account
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
};
