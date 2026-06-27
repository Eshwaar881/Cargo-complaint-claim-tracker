import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Loader2, Lock, User, Mail, ArrowLeft, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [role, setRole] = useState(null); // null | 'manager' | 'customer'
  const [isRegister, setIsRegister] = useState(true); // true = sign up, false = sign in (for customer)
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Manager login
  const handleManagerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.loginManager(email, password);
      login(res.user);
    } catch (err) {
      setError(err.message || 'Invalid manager credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Customer registration or login
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Name is required for registration.');
        }
        const res = await api.registerCustomer(name, email, password);
        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          login(res.user);
        }, 1200);
      } else {
        const res = await api.loginCustomer(email, password);
        login(res.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRole(null);
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const selectManager = () => {
    setRole('manager');
    setEmail('psm@nxtwave.in');
    setPassword('nxtwave123!');
  };

  const selectCustomer = () => {
    setRole('customer');
    setIsRegister(true);
  };

  return (
    <div className="min-h-screen bg-tower-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cargo-orange/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-resolved-teal/5 blur-[120px] pointer-events-none" />
      
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#F5F2EA 1px,transparent 1px),linear-gradient(90deg,#F5F2EA 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-12 h-12 rounded-2xl bg-cargo-orange flex items-center justify-center shadow-lg shadow-cargo-orange/20"
          >
            <Package size={24} className="text-tower-900" />
          </motion.div>
          <div>
            <h2 className="font-display text-2xl font-bold text-paper-100 leading-tight">Cargo Ops</h2>
            <p className="text-xs text-paper-100/40 tracking-wider">Neon Auth Edition v2.0</p>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-tower-800/80 backdrop-blur-xl border border-panel-600/60 rounded-3xl shadow-2xl overflow-hidden relative">
          
          <AnimatePresence mode="wait">
            {role === null ? (
              // ───────────────── ROLE SELECTOR VIEW ─────────────────
              <motion.div
                key="select-role"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="p-8"
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-2xl font-bold text-paper-100">Welcome to Cargo Ops</h1>
                  <p className="text-paper-100/50 text-sm mt-2">Select your login portal to proceed</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-breach-red/10 border border-breach-red/30 rounded-xl px-4 py-3 text-breach-red text-sm mb-4">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Manager Option */}
                  <button
                    onClick={selectManager}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-cargo-orange/5 border border-cargo-orange/20 hover:border-cargo-orange/50 hover:bg-cargo-orange/10 transition-all duration-200 group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cargo-orange/15 flex items-center justify-center group-hover:bg-cargo-orange/25 transition-colors">
                        <Lock size={20} className="text-cargo-orange" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-paper-100">Manager Sign In</div>
                        <div className="text-xs text-paper-100/40 mt-0.5">Secure dashboard for ops team</div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-panel-700/50 flex items-center justify-center group-hover:bg-cargo-orange/20 group-hover:text-cargo-orange transition-all duration-200">
                      <span className="text-lg font-bold">→</span>
                    </div>
                  </button>

                  {/* Customer Option */}
                  <button
                    onClick={selectCustomer}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-panel-700/40 border border-panel-600/40 hover:border-resolved-teal/40 hover:bg-panel-700/60 transition-all duration-200 group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-resolved-teal/10 flex items-center justify-center group-hover:bg-resolved-teal/20 transition-colors">
                        <User size={20} className="text-resolved-teal" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-paper-100">Customer Portal</div>
                        <div className="text-xs text-paper-100/40 mt-0.5">Book shipments & track complaints</div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-panel-700/50 flex items-center justify-center group-hover:bg-resolved-teal/20 group-hover:text-resolved-teal transition-all duration-200">
                      <span className="text-lg font-bold">→</span>
                    </div>
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-panel-600/40 text-center">
                  <p className="text-[11px] text-paper-100/25 leading-relaxed">
                    By accessing the Cargo Ops Platform, you agree to our Terms of Service & Privacy Policy guidelines.
                  </p>
                </div>
              </motion.div>
            ) : role === 'manager' ? (
              // ───────────────── MANAGER LOGIN VIEW ─────────────────
              <motion.div
                key="manager-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="p-8"
              >
                <div className="flex items-center gap-2 mb-6">
                  <button
                    onClick={handleBack}
                    className="p-1.5 rounded-lg hover:bg-panel-700 text-paper-100/50 hover:text-paper-100 transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-cargo-orange bg-cargo-orange/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Ops Desk Login
                  </span>
                </div>

                <div className="mb-6">
                  <h1 className="font-display text-xl font-bold text-paper-100">Manager Access</h1>
                  <p className="text-paper-100/55 text-xs mt-1">Enter manager credentials to gain full access</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-breach-red/10 border border-breach-red/30 rounded-xl px-4 py-3 text-breach-red text-xs mb-4">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleManagerLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-paper-100/50 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-paper-100/30" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-panel-700/50 border border-panel-600/50 rounded-xl pl-10 pr-4 py-3 text-sm text-paper-100 outline-none focus:border-cargo-orange/60 transition-colors"
                        placeholder="manager@yourcompany.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-paper-100/50 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3.5 text-paper-100/30" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-panel-700/50 border border-panel-600/50 rounded-xl pl-10 pr-4 py-3 text-sm text-paper-100 outline-none focus:border-cargo-orange/60 transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-cargo-orange text-tower-900 font-display font-semibold hover:bg-cargo-orange-soft transition-all duration-200 shadow-lg shadow-cargo-orange/15 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin text-tower-900" />
                    ) : (
                      'Sign In as Manager'
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              // ───────────────── CUSTOMER PORTAL VIEW ─────────────────
              <motion.div
                key="customer-auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="p-8"
              >
                <div className="flex items-center gap-2 mb-6">
                  <button
                    onClick={handleBack}
                    className="p-1.5 rounded-lg hover:bg-panel-700 text-paper-100/50 hover:text-paper-100 transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-resolved-teal bg-resolved-teal/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Customer Portal
                  </span>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 bg-panel-700/50 p-1 rounded-xl mb-6 border border-panel-600/30">
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isRegister
                        ? 'bg-resolved-teal text-white shadow-sm'
                        : 'text-paper-100/40 hover:text-paper-100'
                    }`}
                  >
                    Register / Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      !isRegister
                        ? 'bg-resolved-teal text-white shadow-sm'
                        : 'text-paper-100/40 hover:text-paper-100'
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                <div className="mb-6">
                  <h1 className="font-display text-xl font-bold text-paper-100">
                    {isRegister ? 'Create Customer Account' : 'Customer Sign In'}
                  </h1>
                  <p className="text-paper-100/55 text-xs mt-1">
                    {isRegister 
                      ? 'Register to save details in the Neon PostgreSQL database permanently'
                      : 'Enter your email and password to access your account'}
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-breach-red/10 border border-breach-red/30 rounded-xl px-4 py-3 text-breach-red text-xs mb-4">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-start gap-2 bg-resolved-teal/10 border border-resolved-teal/30 rounded-xl px-4 py-3 text-resolved-teal text-xs mb-4">
                    <Sparkles size={14} className="flex-shrink-0 mt-0.5 text-resolved-teal animate-pulse" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCustomerSubmit} className="space-y-4">
                  {isRegister && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[11px] font-semibold text-paper-100/50 uppercase tracking-wider mb-1.5">Full Name</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-3.5 text-paper-100/30" />
                          <input
                            type="text"
                            required={isRegister}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-panel-700/50 border border-panel-600/50 rounded-xl pl-10 pr-4 py-3 text-sm text-paper-100 outline-none focus:border-resolved-teal/60 transition-colors"
                            placeholder="Alex Mercer"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-paper-100/50 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-paper-100/30" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-panel-700/50 border border-panel-600/50 rounded-xl pl-10 pr-4 py-3 text-sm text-paper-100 outline-none focus:border-resolved-teal/60 transition-colors"
                        placeholder="alex@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-paper-100/50 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3.5 text-paper-100/30" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-panel-700/50 border border-panel-600/50 rounded-xl pl-10 pr-4 py-3 text-sm text-paper-100 outline-none focus:border-resolved-teal/60 transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-resolved-teal text-white font-display font-semibold hover:bg-resolved-teal/80 transition-all duration-200 shadow-lg shadow-resolved-teal/15 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : isRegister ? (
                      'Register & Connect'
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer info */}
        <p className="text-center text-paper-100/20 text-xs mt-6">
          Powered by Neon Serverless PostgreSQL Database
        </p>
      </div>
    </div>
  );
}
