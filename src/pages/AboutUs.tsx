import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Target, 
  Zap, 
  Users, 
  Cpu, 
  Rocket, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Boxes,
  FileCheck,
  Layout,
  Database
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ProfileCard from '../components/about/ProfileCard';
import SupervisorCard from '../components/about/SupervisorCard';

const AboutUs: React.FC = () => {
  const { t } = useTranslation();

  React.useEffect(() => {
    console.log("AboutUs Page Rendered - V26.4.25");
  }, []);

  const teamMembers = [
    {
      name: "Enayatullah Mansoor",
      role: "Project Manager & Full Stack Developer",
      bio: "Expert in full-stack architecture and UI/UX design. Leads the overall development lifecycle and user experience strategy.",
      skills: ["React", "Node.js", "UI/UX"],
      imagePath: "/assets/images/team/enayatullah.jpg"
    },
    {
      name: "Fazalrahman Mayar",
      role: "Backend Architect & Database Designer",
      bio: "Specializes in secure data modeling and API efficiency. Ensures systemic robustness for university-scale operations.",
      skills: ["Database", "Security", "Express"],
      imagePath: "/assets/images/team/mayar.jpg"
    },
    {
      name: "ShamSurahman Mushfiq",
      role: "Frontend Engineer & Interaction Designer",
      bio: "Focused on building responsive, high-performance user interfaces and real-time data visualization components.",
      skills: ["Frontend", "Tailwind", "Motion"],
      imagePath: "/assets/images/team/mushfiq.jpg"
    },
    {
      name: "Abdulhadi Rahimi",
      role: "System Analyst & Requirements Engineer",
      bio: "Bridge between institutional needs and technical specifications. Master of logic flow and workflow automation.",
      skills: ["Analysis", "Flowcharts", "UML"],
      imagePath: "/assets/images/team/rahimi.jpg"
    },
    {
      name: "Nazir Ahmad Bashari",
      role: "QA Engineer & Implementation Specialist",
      bio: "Ensures production readiness through rigorous testing and deployment standards for government institutions.",
      skills: ["Testing", "Deployment", "CI/CD"],
      imagePath: "/assets/images/team/bashari.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <section className="relative h-[400px] lg:h-[500px] bg-slate-900 overflow-hidden flex items-center justify-center text-center px-6">
        <div className="absolute inset-0 opacity-20">
           <div className="absolute inset-0 bg-[#0F8F7F]/20 mix-blend-overlay" />
           <div className="grid grid-cols-12 h-full">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="border-r border-white/5 h-full" />
              ))}
           </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 rounded-full border border-white/10 text-white/80">
            <Building2 size={16} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Kandahar University</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">
            About Our <span className="text-[#0F8F7F]">Project</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            A comprehensive Warehouse Management System (WMS) designed to modernize logistics, inventory tracking, and procurement processes for large-scale academic institutions.
          </p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 space-y-24">
        
        {/* Intro & Objectives */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[32px] p-8 lg:p-12 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6"
          >
            <div className="w-16 h-16 bg-primary-teal/10 rounded-2xl flex items-center justify-center text-primary-teal">
              <Target size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Project Introduction</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              This Warehouse Management System is a state-of-the-art ERP solution developed for the General Warehouse of Kandahar University. It replaces inefficient manual ledger systems with a unified digital platform that provides real-time visibility into stock levels, streamlined procurement requests, and automated audit trails.
            </p>
            <p className="text-slate-600 font-medium leading-relaxed">
              Designed as a final year capstone project for the Faculty of Computer Science, it demonstrates the practical application of modern software engineering principles to solve real-world institutional challenges.
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 hover:border-primary-teal/30 transition-colors">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><Boxes size={24} /></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objective</h4>
              <p className="text-sm font-bold text-slate-800">Inventory Control</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 hover:border-primary-teal/30 transition-colors">
              <div className="p-3 bg-green-50 text-green-500 rounded-xl"><ShieldCheck size={24} /></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objective</h4>
              <p className="text-sm font-bold text-slate-800">Total Transparency</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 hover:border-primary-teal/30 transition-colors">
              <div className="p-3 bg-purple-50 text-purple-500 rounded-xl"><Zap size={24} /></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objective</h4>
              <p className="text-sm font-bold text-slate-800">Process Automation</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 hover:border-primary-teal/30 transition-colors">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><BarChart3 size={24} /></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objective</h4>
              <p className="text-sm font-bold text-slate-800">Instant Reporting</p>
            </div>
          </motion.section>
        </div>

        {/* Features Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-teal">Core Capabilities</h4>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">System Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Boxes, title: "Inventory Management", desc: "Live tracking of assets, categorization, and threshold alerts." },
              { icon: FileCheck, title: "Request & Approval", desc: "Digital workflow for procurement and item disbursement." },
              { icon: BarChart3, title: "Reporting System", desc: "Automated generation of audit reports and stock summaries." },
              { icon: ShieldCheck, title: "Role-Based Access", desc: "Granular permissions for admins, warehousemen, and staff." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col gap-5 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">{feature.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="space-y-12">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-6">
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-teal">Development Team</h4>
               <h2 className="text-4xl font-black text-slate-900 tracking-tight">The Visionaries Behind</h2>
            </div>
            <p className="text-slate-500 text-xs font-medium max-w-sm">
              Our diverse team of computer science students dedicated to building efficient, production-ready software solutions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {teamMembers.map((member, i) => (
              <ProfileCard key={i} {...member} />
            ))}
          </div>
        </section>

        {/* Supervisor Section */}
        <section className="space-y-12">
           <div className="text-center space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-teal">Project Supervision</h4>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Academic Guidance</h2>
          </div>
          <SupervisorCard 
            name="Hikmatullah Omid"
            faculty="Computer Science"
            department="Network Department"
            role="Academic Supervisor"
            bio="Professor Hikmatullah Omid is a distinguished faculty member at Kandahar University, specialized in Network infrastructure and System Architecture. His mentorship focuses on aligning academic research with practical software engineering standards."
            quote="This project demonstrates a modern and practical implementation of a warehouse management system and reflects strong teamwork and technical skills."
            imagePath="/assets/images/team/omid.jpg"
          />
        </section>

        {/* Technology Stack & Future */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 rounded-[32px] p-10 text-white space-y-10">
            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight">Technology Stack</h2>
              <p className="text-slate-400 text-sm font-medium">Built with secure, modern, and high-performance technologies.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#0F8F7F]">
                  <Layout size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Frontend</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>React / Vite</span>
                    <span className="text-slate-500">Modern CI</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Tailwind CSS</span>
                    <span className="text-slate-500">Atomic Style</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#0F8F7F]">
                  <Cpu size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Backend</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Node.js / Express</span>
                    <span className="text-slate-500">Scalable</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>TypeScript</span>
                    <span className="text-slate-500">Type Safe</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#0F8F7F]">
                  <Database size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Database</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>PostgreSQL</span>
                    <span className="text-slate-500">Relational</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Redis</span>
                    <span className="text-slate-500">Caching</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-teal rounded-[32px] p-10 text-white space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Rocket size={24} />
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-tight">Future Scope</h2>
              <div className="space-y-3">
                {[
                  "Mobile Application Integration",
                  "AI Predicative Inventory",
                  "Blockchain Transparency",
                  "Multi-Language Support"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-black uppercase tracking-wider">
                    <CheckCircle2 size={14} className="text-white/40" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Link 
              to="/guide"
              className="group flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors"
            >
              System Workflow Guide <ArrowRight size={16} className="text-white group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
