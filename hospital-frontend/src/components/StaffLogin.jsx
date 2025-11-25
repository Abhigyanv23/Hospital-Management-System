import React, { useState } from 'react';
import { LoaderCircle, KeyRound, UserCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api'; // Using api proxy normally, but logic here is self contained or uses api service

const StaffLogin = ({ role, onLoginSuccess }) => {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, id: staffId, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      localStorage.setItem('jwt_token', result.token);
      localStorage.setItem('user_id', result.user.id);
      localStorage.setItem('user_name', result.user.name);
      localStorage.setItem('user_role', result.user.role);

      onLoginSuccess(role, result.user.id, result.user.name);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg ${role === 'Doctor' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
            <UserCircle className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-800">{role} Portal</h3>
        <p className="text-slate-500 text-sm">Enter your credentials to access the system.</p>
      </div>
      
      {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm text-center font-medium">{error}</div>}
      
      <div className="space-y-4">
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">{role} ID</label>
            <div className="relative">
                <UserCircle className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full p-3 pl-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono" placeholder="ID Number" required />
            </div>
        </div>
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
            <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 pl-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="••••••••" required />
            </div>
        </div>
      </div>
      
      <button type="submit" disabled={isLoading} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center ${role === 'Doctor' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
        {isLoading ? <LoaderCircle className="animate-spin w-5 h-5" /> : 'Secure Login'}
      </button>
    </form>
  );
};

export default StaffLogin;