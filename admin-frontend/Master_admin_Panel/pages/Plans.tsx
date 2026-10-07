import React from 'react';
import { Check, Edit, Plus } from 'lucide-react';

const MOCK_PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    interval: 'forever',
    features: ['Up to 100 Products', 'Basic Invoicing', 'Community Support', '1 User Limit'],
    activeSubscribers: 145,
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '$29',
    interval: 'per month',
    features: ['Unlimited Products', 'Advanced Analytics', 'Priority Support', 'Up to 5 Users', 'Custom Domain'],
    activeSubscribers: 62,
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    interval: 'per month',
    features: ['Everything in Pro', 'Dedicated Account Manager', 'Custom Integrations', 'Unlimited Users', 'SLA Guarantee'],
    activeSubscribers: 11,
    highlighted: false,
  }
];

export const Plans: React.FC = () => {
  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plans & Subscriptions</h1>
          <p className="text-slate-500 mt-1">Manage SaaS tiers, feature limits, and view active subscribers.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          <Plus size={18} />
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {MOCK_PLANS.map((plan) => (
          <div key={plan.id} className={`bg-white border rounded-xl overflow-hidden relative shadow-sm ${plan.highlighted ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-slate-200'}`}>
            {plan.highlighted && (
              <div className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wider text-center py-1">
                Most Popular
              </div>
            )}
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <button className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Edit Plan">
                  <Edit size={16} />
                </button>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500">/{plan.interval}</span>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50">
              <div className="mb-6 flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-sm text-slate-500">Active Subscribers</span>
                <span className="text-lg font-bold text-emerald-600">{plan.activeSubscribers}</span>
              </div>

              <h4 className="text-sm font-semibold text-slate-700 mb-3">Plan Features</h4>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans;
