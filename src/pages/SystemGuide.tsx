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
      title: t('guide_step1_title'),
      icon: Package,
      desc: t('guide_step1_desc'),
      action: t('guide_step1_action'),
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: t('guide_step2_title'),
      icon: Truck,
      desc: t('guide_step2_desc'),
      action: t('guide_step2_action'),
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      title: t('guide_step3_title'),
      icon: FileText,
      desc: t('guide_step3_desc'),
      action: t('guide_step3_action'),
      color: "bg-amber-50 text-amber-600"
    },
    {
      title: t('guide_step4_title'),
      icon: ShoppingCart,
      desc: t('guide_step4_desc'),
      action: t('guide_step4_action'),
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: t('guide_step5_title'),
      icon: CheckCircle2,
      desc: t('guide_step5_desc'),
      action: t('guide_step5_action'),
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      title: t('guide_step6_title'),
      icon: BarChart3,
      desc: t('guide_step6_desc'),
      action: t('guide_step6_action'),
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
              <span className="text-[10px] font-black uppercase tracking-widest">{t('workflow_guide')}</span>
           </div>
           <h1 className="text-4xl lg:text-6xl font-black tracking-tight">{t('how_to_use')} <span className="text-primary-teal">{t('system')}</span></h1>
           <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
             {t('how_to_use_desc')}
           </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-start">
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
            <div className="space-y-2">
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

      <section className="fintech-card p-12 bg-slate-50 border-2 border-slate-900 rounded-[44px]">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8 text-start">{t('qa_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-start">
           <div className="space-y-4">
              <h4 className="text-sm font-black text-primary-teal uppercase tracking-widest">{t('q1_title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{t('q1_ans')}</p>
           </div>
           <div className="space-y-4">
              <h4 className="text-sm font-black text-primary-teal uppercase tracking-widest">{t('q2_title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{t('q2_ans')}</p>
           </div>
           <div className="space-y-4">
              <h4 className="text-sm font-black text-primary-teal uppercase tracking-widest">{t('q3_title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{t('q3_ans')}</p>
           </div>
           <div className="space-y-4">
              <h4 className="text-sm font-black text-primary-teal uppercase tracking-widest">{t('q4_title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{t('q4_ans')}</p>
           </div>
           <div className="space-y-4">
              <h4 className="text-sm font-black text-primary-teal uppercase tracking-widest">{t('q5_title')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{t('q5_ans')}</p>
           </div>
        </div>
      </section>

      <section className="fintech-card p-12 bg-white flex flex-col lg:flex-row items-center justify-between gap-10 border-2 border-primary-teal/10 text-start">
         <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('need_help')}</h2>
            <p className="text-slate-500 font-medium">{t('need_help_desc')}</p>
         </div>
         <div className="flex gap-4 w-full lg:w-auto">
            <Link to="/settings" className="flex-1 lg:flex-none py-4 px-8 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
               <Settings size={16} />
               {t('configure_system')}
            </Link>
         </div>
      </section>
    </div>
  );
};

export default SystemGuide;
