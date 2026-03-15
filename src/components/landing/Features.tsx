import React from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, Brain, BarChart3, ArrowRight, CheckCircle2, FileText, UserCheck } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

interface FeaturesProps {
  onNavigate?: (page: string) => void;
}

export const Features: React.FC<FeaturesProps> = ({ onNavigate }) => {
  const { t } = useLang();

  const primaryFeature = {
    icon: <UserCheck className="w-7 h-7 text-[#22C55E]" />,
    title: t.features.f7Title,
    description: t.features.f7Desc,
  };

  const secondaryFeatures = [
    { icon: <Zap className="w-6 h-6 text-[#22C55E]" />, title: t.features.f1Title, description: t.features.f1Desc },
    { icon: <Clock className="w-6 h-6 text-[#EAB308]" />, title: t.features.f2Title, description: t.features.f2Desc },
    { icon: <BarChart3 className="w-6 h-6 text-[#EAB308]" />, title: t.features.f6Title, description: t.features.f6Desc },
  ];

  const timelineSteps = [
    {
      number: '01',
      title: t.features.step1Title,
      description: t.features.step1Desc,
      icon: <FileText size={22} className="text-[#22C55E]" />,
      side: 'right',
      topClass: 'top-[90px]',
      nodeTopClass: 'top-[180px]',
    },
    {
      number: '02',
      title: t.features.step2Title,
      description: t.features.step2Desc,
      icon: <Brain size={22} className="text-[#EAB308]" />,
      side: 'left',
      topClass: 'top-[420px]',
      nodeTopClass: 'top-[515px]',
    },
    {
      number: '03',
      title: t.features.step3Title,
      description: t.features.step3Desc,
      icon: <BarChart3 size={22} className="text-[#22C55E]" />,
      side: 'right',
      topClass: 'top-[760px]',
      nodeTopClass: 'top-[860px]',
    },
  ];
  return (
    <section className="bg-[#0A0F1A] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-[#22C55E]/4 via-transparent to-[#EAB308]/3 blur-[120px] pointer-events-none"></div>

      {/* How it works */}
      <div className="container mx-auto px-4 md:px-6 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-sm font-medium mb-6">
            <CheckCircle2 size={14} />
            {t.features.howItWorks}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            {t.features.stepsHeading1} <span className="text-gradient">{t.features.stepsHeading2}</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {t.features.stepsSubtitle}
          </p>
        </motion.div>

        <div className="relative mb-20">
          <div className="hidden md:block relative max-w-6xl mx-auto h-[1080px]">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 1200"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.95" />
                  <stop offset="55%" stopColor="#EAB308" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.95" />
                </linearGradient>
              </defs>

              <motion.path
                d="M500 20 C360 220 640 390 500 600 C360 810 640 990 500 1180"
                stroke="rgba(34,197,94,0.15)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />

              <motion.path
                d="M500 20 C360 220 640 390 500 600 C360 810 640 990 500 1180"
                stroke="url(#timelineGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.45 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
              />

              <circle r="9" fill="#EAB308" filter="url(#glow)">
                <animateMotion
                  dur="4.8s"
                  repeatCount="indefinite"
                  path="M500 20 C360 220 640 390 500 600 C360 810 640 990 500 1180"
                />
              </circle>

              <defs>
                <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>

            {timelineSteps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ duration: 0.8, delay: idx * 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute left-0 right-0 ${step.topClass}`}
                >
                  <div className={`w-[43%] ${step.side === 'right' ? 'ml-auto pr-6 text-left' : 'mr-auto pl-6 text-left'}`}>
                    <div className="group rounded-2xl border border-[#22C55E]/14 bg-[#0F1A2A]/82 backdrop-blur-xl p-6 hover:-translate-y-1 hover:border-[#22C55E]/35 hover:shadow-[0_16px_34px_rgba(34,197,94,0.12)] transition-all duration-300">
                      <div className="text-6xl font-display font-bold text-[#22C55E]/12 leading-none mb-3">{step.number}</div>
                      <div className="w-12 h-12 rounded-2xl bg-[#162032] border border-[#22C55E]/20 flex items-center justify-center mb-3 group-hover:border-[#22C55E]/42 transition-all duration-300 group-hover:scale-105">
                        {step.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-base text-slate-400 leading-relaxed max-w-sm">{step.description}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ duration: 0.5, delay: idx * 0.2 + 0.12, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`absolute left-1/2 -translate-x-1/2 ${step.nodeTopClass}`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#22C55E] to-[#EAB308] shadow-[0_0_0_4px_rgba(34,197,94,0.14),0_0_22px_rgba(34,197,94,0.55)]" />
                </motion.div>
              </React.Fragment>
            ))}
          </div>

          <div className="md:hidden space-y-6 max-w-xl mx-auto">
            {timelineSteps.map((step, idx) => (
              <motion.div
                key={`${step.number}-mobile`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.7, delay: idx * 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-2xl border border-[#22C55E]/14 bg-[#0F1A2A]/80 p-5"
              >
                <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-gradient-to-b from-[#22C55E] via-[#EAB308] to-[#22C55E]" />
                <div className="pl-4">
                  <div className="text-5xl font-display font-bold text-[#22C55E]/12 leading-none mb-2">{step.number}</div>
                  <div className="w-11 h-11 rounded-2xl bg-[#162032] border border-[#22C55E]/20 flex items-center justify-center mb-3">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1.5">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            {t.features.everythingHeading1} <span className="text-gradient">{t.features.everythingHeading2}</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {t.features.everythingSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-20 items-stretch max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-12 group"
          >
            <div className="h-full bg-gradient-to-br from-[#0F1A2A]/95 via-[#132033]/90 to-[#162032]/90 backdrop-blur-xl rounded-2xl border border-[#22C55E]/20 p-6 md:p-7 hover:-translate-y-1 hover:border-[#22C55E]/35 hover:shadow-[0_14px_36px_rgba(34,197,94,0.14)] transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#162032] flex items-center justify-center border border-[#22C55E]/25 group-hover:border-[#22C55E]/45 transition-colors shrink-0">
                    {primaryFeature.icon}
                  </div>
                  <div>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] tracking-wide uppercase text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 mb-2">
                      Core Feature
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1.5">{primaryFeature.title}</h3>
                    <p className="text-sm md:text-base text-slate-300">{primaryFeature.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {secondaryFeatures.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.04 }}
              className="group lg:col-span-4"
            >
              <div className="h-full bg-[#0F1A2A]/72 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 p-5 hover:-translate-y-1 hover:border-[#22C55E]/30 hover:shadow-[0_10px_26px_rgba(34,197,94,0.1)] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#162032] flex items-center justify-center border border-[#22C55E]/12 mb-3 group-hover:border-[#22C55E]/32 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-[15px] font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-400 truncate" title={feature.description}>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#EAB308]/10 rounded-3xl border border-[#22C55E]/15 p-12 backdrop-blur-xl max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              {t.features.ctaHeading}
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              {t.features.ctaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#22C55E] to-[#EAB308] text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-green-500/25 text-lg"
              >
                {t.features.ctaBtn} <ArrowRight size={20} />
              </button>
              <button
                onClick={() => onNavigate?.('features')}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-slate-400 hover:text-white font-medium transition-colors"
              >
                {t.features.ctaLink} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
