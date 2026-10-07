import React from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import { LandingFooter } from '../components/LandingFooter';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <LandingNavbar />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
            <p className="text-slate-500 mb-8 text-sm">Last updated: October 2026</p>
            
            <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
              <p>
                At StockIN, accessible from our platform, one of our main priorities is the privacy of our visitors and users. This Privacy Policy document contains types of information that is collected and recorded by StockIN and how we use it.
              </p>
              
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
              <p>
                The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Account and profile information (Name, Email, Business Details)</li>
                <li>Financial and inventory data inputted into the system</li>
                <li>Usage data and platform interaction metrics</li>
              </ul>

              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect in various ways, including to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide, operate, and maintain our platform</li>
                <li>Improve, personalize, and expand our platform</li>
                <li>Understand and analyze how you use our platform</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Communicate with you for customer service, updates, and marketing</li>
              </ul>

              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Data Security</h2>
              <p>
                We employ bank-grade security measures to protect your business data. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Contact Us</h2>
              <p>
                If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at legal@auraforge.site.
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};
