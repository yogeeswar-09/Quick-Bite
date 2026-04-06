import React, { useState } from 'react';
import { db } from '../services/supabaseService';
import { User, UserRole } from '../types';
import { Heart, ArrowRight, AlertTriangle, UserPlus, LogIn, Lock, Mail, User as UserIcon, Zap, Coffee, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!email || !password || (!isLogin && !name)) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
    }

    try {
      if (isLogin) {
          const user = await db.login(email, password);
          onLogin(user);
      } else {
          const result = await db.register({ name, email, password, role: UserRole.CUSTOMER });
          if (result.message) {
              setSuccessMessage(result.message);
              setIsLogin(true);
              setPassword('');
          } else if (result.user) {
              onLogin(result.user);
          }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
      setIsLogin(!isLogin);
      setError('');
      setSuccessMessage('');
      setPassword('');
      if (!isLogin) {
          setName('');
      }
  };

  const handleQuickLogin = async (role: 'admin' | 'student') => {
      setLoading(true);
      setError('');
      try {
          let user;
          if (role === 'admin') {
              user = await db.login('admin@quickbite.com', 'admin');
          } else {
              user = await db.login('student@demo.com', 'student');
          }
          onLogin(user);
      } catch (err: any) {
          setError('Demo account not found. Please refresh to re-seed data.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 mb-6 shadow-lg shadow-orange-500/30 transform hover:scale-110 transition-transform duration-300">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {isLogin ? 'Welcome Back' : 'Join Quick Bite'}
            </h1>
            <p className="text-slate-400 text-sm">
                {isLogin ? 'Enter your details to access your account' : 'Create an account to start ordering'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
              
              {!isLogin && (
                  <div className="relative group animate-in slide-in-from-left-5 fade-in duration-300">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                      <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-slate-900 outline-none transition-all text-sm placeholder-slate-500"
                          placeholder="Full Name"
                      />
                  </div>
              )}

              <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                  <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-slate-900 outline-none transition-all text-sm placeholder-slate-500"
                      placeholder="Email Address"
                  />
              </div>

              <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                  <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-slate-900 outline-none transition-all text-sm placeholder-slate-500"
                      placeholder="Password"
                  />
              </div>

              {error && (
                  <div className="flex items-center text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl animate-in shake border border-red-500/20">
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error}
                  </div>
              )}

              {successMessage && (
                  <div className="flex items-center text-green-400 text-xs font-bold bg-green-500/10 p-3 rounded-xl animate-in fade-in border border-green-500/20">
                      <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {successMessage}
                  </div>
              )}

              <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center mt-6"
              >
                  {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                      <>
                          {isLogin ? 'Sign In' : 'Create Account'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                  )}
              </button>
          </form>

          <div className="text-center mt-6">
              <button 
                  onClick={toggleMode}
                  className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                  {isLogin ? "Don't have an account?" : "Already have an account?"} <span className="text-orange-500 font-bold ml-1">
                      {isLogin ? 'Sign up' : 'Log in'}
                  </span>
              </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-[10px] text-center text-slate-500 mb-4 font-bold uppercase tracking-wider flex items-center justify-center">
              <Zap className="w-3 h-3 mr-1 text-yellow-500" /> One-Click Demo Access
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                  onClick={() => handleQuickLogin('student')}
                  disabled={loading}
                  className="bg-slate-800/50 hover:bg-orange-500/10 hover:border-orange-500/50 border border-white/5 text-slate-300 hover:text-orange-400 py-3 rounded-xl text-xs font-bold transition-all"
              >
                  Student Demo
              </button>
              <button 
                  onClick={() => handleQuickLogin('admin')}
                  disabled={loading}
                  className="bg-slate-800/50 hover:bg-blue-500/10 hover:border-blue-500/50 border border-white/5 text-slate-300 hover:text-blue-400 py-3 rounded-xl text-xs font-bold transition-all"
              >
                  Admin Demo
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
             <p className="text-slate-600 text-xs">Protected by reCAPTCHA and Subject to the Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;