import React from 'react';
import { motion } from 'motion/react';
import { Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { VertexLogo } from '../components/ui/VertexLogo';
import { useLang } from '../contexts/LanguageContext';

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const { lang } = useLang();
  const isVi = lang === 'vi';

  const title = isVi ? 'Trang không tìm thấy' : 'Page Not Found';
  const description = isVi
    ? 'Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.'
    : 'Sorry, the page you are looking for does not exist or has been moved.';
  const btnHome = isVi ? 'Về trang chủ' : 'Back to Home';
  const btnBack = isVi ? 'Quay lại' : 'Go Back';
  const helpText = isVi
    ? 'Bạn cần trợ giúp? Hãy liên hệ với đội ngũ hỗ trợ của chúng tôi.'
    : 'Need help? Contact our support team.';

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-950/15 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-yellow-950/10 blur-3xl pointer-events-none"></div>

      {/* Floating stars or dots for premium feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-lg text-center z-10 flex flex-col items-center">
        {/* Logo Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="vertex-brand flex items-center gap-3 mb-10 cursor-pointer"
          onClick={() => onNavigate('landing')}
        >
          <div className="vertex-mark w-10 h-10 rounded-xl flex items-center justify-center text-white">
            <VertexLogo size={22} />
          </div>
          <span className="font-display text-2xl vertex-wordmark text-white">Vertex</span>
        </motion.div>

        {/* 404 Art Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full bg-[#0F1A2A]/80 backdrop-blur-xl rounded-2xl border border-white/5 p-8 sm:p-12 shadow-2xl shadow-black/40 mb-8"
        >
          {/* Animated 404 text */}
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.3 }}
            className="text-8xl sm:text-9xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#22C55E] to-[#EAB308] tracking-widest select-none drop-shadow-[0_0_15px_rgba(34,197,94,0.2)] mb-4"
          >
            404
          </motion.h1>

          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
            {title}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            {description}
          </p>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full sm:w-auto h-11 px-6 text-sm font-medium border-white/10 hover:border-white/20 text-slate-300 hover:text-white"
              icon={<ArrowLeft size={16} />}
            >
              {btnBack}
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigate('landing')}
              className="w-full sm:w-auto h-11 px-6 text-sm font-medium"
              icon={<Home size={16} />}
            >
              {btnHome}
            </Button>
          </div>
        </motion.div>

        {/* Contact/Support Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          <HelpCircle size={14} />
          <span>{helpText}</span>
        </motion.div>
      </div>
    </div>
  );
};
