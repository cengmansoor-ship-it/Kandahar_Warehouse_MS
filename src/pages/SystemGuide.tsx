import React from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Truck, 
  FileText, 
  ShoppingCart, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const SystemGuide: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      title: "1. Inventory Mapping",
      icon: Package,
      desc: "Assign government-standard codes (BAB/Fasl) to your items. This ensures accounting compatibility.",
      action: "Go to Inventory > Map New SKU",
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "2. Receiving Stock",
      icon: Truck,
      desc: "When items arrive, log them into the system. Use Excel bulk import for large shipments.",
      action: "Go to Receiving > Log New Arrival",
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      title: "3. Requirement Requests",
      icon: FileText,
      desc: "Departments submit official requests for needed items. These follow an approval chain.",
      action: "Go to Requests > Create Official Request",
      color: "bg-amber-50 text-amber-600"
    },
    {
      title: "4. Procurement Lifecycle",
      icon: ShoppingCart,
      desc: "Convert approved requests into tenders, compare vendor prices, and issue Purchase Orders (PO).",
      action: "Go to Procurement Manager",
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "5. Distribution & History",
      icon: CheckCircle2,
      desc: "Final delivery of items to the requesting department. System logs everything in the ledger.",
      action: "Track in Dashboard / Reports",
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      title: "6. Audit & Analytics",
      icon: BarChart3,
      desc: "Generate annual reports and maintain a transparent inventory ledger for government audits.",
      action: "Go to Reports",
      color: "bg-red-50 text-red-600"
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <section className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-teal/20 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 space-y-6">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full border border-white/10">
              <HelpCircle size={14} className="text-primary-teal" />
              <span className="text-[10px] font-black uppercase tracking-widest">Workflow Guide</span>
           </div>
           <h1 className="text-4xl lg:text-6xl font-black tracking-tight">How to use the <span className="text-primary-teal">System</span></h1>
           <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
             Follow this standard operating procedure to manage the Kandahar University General Warehouse assets effectively.
           </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="fintech-card p-8 bg-white space-y-6 group hover:border-primary-teal/30 transition-all hover:shadow-2xl hover:shadow-primary-teal/5"
          >
            <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <step.icon size={28} />
            </div>
            <div className="space-y-2 text-start">
               <h3 className="text-xl font-black text-slate-900 tracking-tight">{step.title}</h3>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
               <span>{step.action}</span>
               <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      <section className="fintech-card p-12 bg-white flex flex-col lg:flex-row items-center justify-between gap-10 border-2 border-primary-teal/10">
         <div className="space-y-4 text-start">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Need specific help?</h2>
            <p className="text-slate-500 font-medium">Use our intelligent AI assistant in the bottom right corner for real-time guidance on any operations.</p>
         </div>
         <div className="flex gap-4 w-full lg:w-auto">
            <Link to="/settings" className="flex-1 lg:flex-none py-4 px-8 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
               <Settings size={16} />
               Configure System
            </Link>
         </div>
      </section>
    </div>
  );
};

export default SystemGuide;
