import React from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import { LandingFooter } from '../components/LandingFooter';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <LandingNavbar />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Terms of Service</h1>
            <p className="text-slate-500 mb-8 text-sm">Last updated: October 2026</p>
            
            <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
              <p>
                Welcome to StockIN! These terms and conditions outline the rules and regulations for the use of StockIN's Platform, located at app.stockin.com.
              </p>
              
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing this platform, we assume you accept these terms and conditions in full. Do not continue to use StockIN if you do not agree to all of the terms and conditions stated on this page.
              </p>

              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. License to Use</h2>
              <p>
                Unless otherwise stated, AuraForge and/or its licensors own the intellectual property rights for all material on StockIN. All intellectual property rights are reserved. You may access this from StockIN for your own personal use subjected to restrictions set in these terms and conditions.
              </p>
              <p>You must not:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Republish material from StockIN</li>
                <li>Sell, rent, or sub-license material from StockIN</li>
                <li>Reproduce, duplicate or copy material from StockIN</li>
              </ul>

              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. User Responsibilities</h2>
              <p>
                Users are solely responsible for the accuracy, legality, and validity of the business data, invoices, and inventory records inputted into the platform. StockIN is a tool to assist with business management and is not liable for data entry errors made by users.
              </p>

              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Termination</h2>
              <p>
                We may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>

              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Contact Information</h2>
              <p>
                If you have any questions regarding these Terms of Service, please contact us at legal@auraforge.site.
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};
