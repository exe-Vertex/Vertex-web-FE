import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth';
import { Button } from '../components/ui/Button';
import { VertexLogo } from '../components/ui/VertexLogo';
import { useLang } from '../contexts/LanguageContext';

interface PasswordRecoveryPageProps {
  onNavigate: (page: string) => void;
}

const copyByLanguage = {
  en: {
    forgotTitle: 'Forgot your password?',
    forgotSubtitle: 'Enter your account email and we will send a secure reset link.',
    emailLabel: 'Email',
    sendLink: 'Send reset link',
    sentTitle: 'Check your inbox',
    sentMessage: 'If an account with that email exists, a password reset link has been sent.',
    backToLogin: 'Back to sign in',
    invalidEmail: 'Enter a valid email address.',
    requestFailed: 'Unable to request a reset link. Please try again.',
    resetTitle: 'Create a new password',
    resetSubtitle: 'Choose a password you have not used before.',
    passwordLabel: 'New password',
    confirmLabel: 'Confirm new password',
    passwordRequirement: 'At least 8 characters with one letter and one number.',
    resetButton: 'Reset password',
    resetSuccessTitle: 'Password updated',
    resetSuccessMessage: 'Your password has been changed. Sign in again on all devices.',
    invalidLink: 'This reset link is invalid or has expired.',
    passwordMismatch: 'The passwords do not match.',
    weakPassword: 'Use at least 8 characters with one letter and one number.',
    resetFailed: 'Unable to reset your password. Please request a new link.',
  },
  vi: {
    forgotTitle: 'Quên mật khẩu?',
    forgotSubtitle: 'Nhập email tài khoản để nhận liên kết đặt lại mật khẩu an toàn.',
    emailLabel: 'Email',
    sendLink: 'Gửi liên kết',
    sentTitle: 'Kiểm tra hộp thư',
    sentMessage: 'Nếu email này có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu.',
    backToLogin: 'Quay lại đăng nhập',
    invalidEmail: 'Vui lòng nhập đúng định dạng email.',
    requestFailed: 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại.',
    resetTitle: 'Tạo mật khẩu mới',
    resetSubtitle: 'Chọn một mật khẩu bạn chưa từng sử dụng.',
    passwordLabel: 'Mật khẩu mới',
    confirmLabel: 'Xác nhận mật khẩu mới',
    passwordRequirement: 'Ít nhất 8 ký tự, gồm một chữ cái và một chữ số.',
    resetButton: 'Đặt lại mật khẩu',
    resetSuccessTitle: 'Đã cập nhật mật khẩu',
    resetSuccessMessage: 'Mật khẩu đã được thay đổi. Hãy đăng nhập lại trên các thiết bị.',
    invalidLink: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
    passwordMismatch: 'Hai mật khẩu không khớp.',
    weakPassword: 'Mật khẩu cần ít nhất 8 ký tự, gồm một chữ cái và một chữ số.',
    resetFailed: 'Không thể đặt lại mật khẩu. Vui lòng yêu cầu một liên kết mới.',
  },
};

const PasswordRecoveryShell: React.FC<{
  title: string;
  subtitle: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onNavigate, children }) => (
  <main className="min-h-screen bg-[#07111F] px-4 py-8 text-white">
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
      <button
        type="button"
        onClick={() => onNavigate('landing')}
        className="vertex-brand mb-8 flex w-fit items-center gap-2"
      >
        <span className="vertex-mark flex h-9 w-9 items-center justify-center rounded-lg text-white">
          <VertexLogo size={19} />
        </span>
        <span className="vertex-wordmark font-display text-lg">Vertex</span>
      </button>

      <section className="rounded-lg border border-[#22C55E]/15 bg-[#0F1A2A] p-7 shadow-2xl shadow-green-500/5">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </section>
    </div>
  </main>
);

export const ForgotPasswordPage: React.FC<PasswordRecoveryPageProps> = ({ onNavigate }) => {
  const { lang } = useLang();
  const copy = copyByLanguage[lang];
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!/^[^ @]+@[^ @]+[.][^ @]+$/.test(email.trim())) {
      setError(copy.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setIsSent(true);
    } catch {
      setError(copy.requestFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PasswordRecoveryShell
      title={isSent ? copy.sentTitle : copy.forgotTitle}
      subtitle={isSent ? copy.sentMessage : copy.forgotSubtitle}
      onNavigate={onNavigate}
    >
      {isSent ? (
        <div className="space-y-6">
          <CheckCircle2 className="h-10 w-10 text-[#22C55E]" aria-hidden="true" />
          <Button
            type="button"
            variant="primary"
            className="w-full justify-center"
            icon={<ArrowLeft size={18} />}
            onClick={() => onNavigate('login')}
          >
            {copy.backToLogin}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">{copy.emailLabel}</span>
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-[#22C55E]/10 bg-[#162032] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
                placeholder="you@example.com"
              />
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            icon={<ArrowRight size={18} />}
            disabled={isSubmitting}
          >
            {copy.sendLink}
          </Button>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="flex w-full items-center justify-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            {copy.backToLogin}
          </button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
};

export const ResetPasswordPage: React.FC<PasswordRecoveryPageProps> = ({ onNavigate }) => {
  const { lang } = useLang();
  const copy = copyByLanguage[lang];
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(token ? '' : copy.invalidLink);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError(copy.invalidLink);
      return;
    }

    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError(copy.weakPassword);
      return;
    }

    if (password !== confirmation) {
      setError(copy.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      localStorage.removeItem('vertex.accessToken');
      localStorage.removeItem('vertex.refreshToken');
      localStorage.removeItem('vertex.userInfo');
      setIsComplete(true);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '';
      setError(message.includes('invalid or has expired') ? copy.invalidLink : copy.resetFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PasswordRecoveryShell
      title={isComplete ? copy.resetSuccessTitle : copy.resetTitle}
      subtitle={isComplete ? copy.resetSuccessMessage : copy.resetSubtitle}
      onNavigate={onNavigate}
    >
      {isComplete ? (
        <div className="space-y-6">
          <CheckCircle2 className="h-10 w-10 text-[#22C55E]" aria-hidden="true" />
          <Button
            type="button"
            variant="primary"
            className="w-full justify-center"
            icon={<ArrowRight size={18} />}
            onClick={() => onNavigate('login')}
          >
            {copy.backToLogin}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">{copy.passwordLabel}</span>
            <span className="relative block">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[#22C55E]/10 bg-[#162032] py-2.5 pl-10 pr-10 text-sm text-white outline-none transition focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">{copy.confirmLabel}</span>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-lg border border-[#22C55E]/10 bg-[#162032] px-4 py-2.5 text-sm text-white outline-none transition focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
            />
          </label>

          <p className="text-xs leading-5 text-slate-500">{copy.passwordRequirement}</p>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            icon={<ArrowRight size={18} />}
            disabled={isSubmitting || !token}
          >
            {copy.resetButton}
          </Button>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="flex w-full items-center justify-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            {copy.backToLogin}
          </button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
};