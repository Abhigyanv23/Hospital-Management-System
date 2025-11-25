import React, { useState } from 'react';
import { api } from '../services/api';
import { LoaderCircle, Send, CheckCircle } from 'lucide-react';

const PatientLogin = ({ onLoginSuccess, onRegister }) => {
  const [tab, setTab] = useState('signin');

  // Sign-in state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Registration State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState('M');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Registration Flow State
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState('');

  // --- 1. SIGN IN ---
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');
    setIsSigningIn(true);

    try {
      const result = await api.auth.loginPatient(phone, password);
      localStorage.setItem('jwt_token', result.token);
      localStorage.setItem('user_id', result.user.patient_id);
      localStorage.setItem('user_name', result.user.name);
      localStorage.setItem('user_role', result.user.role);
      onLoginSuccess(result.user.role, result.user.patient_id, result.user.name);
    } catch (err) {
      setSignInError(err.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  // --- 2. SEND OTP ---
  const handleSendOtp = async () => {
    setRegError('');
    
    // Validation: 10 Digits
    if (!/^\d{10}$/.test(regPhone)) {
        setRegError('Phone number must be exactly 10 digits.');
        return;
    }

    setIsSendingOtp(true);
    try {
        await api.auth.sendOtp(regPhone);
        setOtpSent(true);
        setRegError(''); // Clear errors on success
    } catch (err) {
        setRegError(err.message);
    } finally {
        setIsSendingOtp(false);
    }
  };

  // --- 3. REGISTER (With OTP) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');

    if (!otpSent) {
        setRegError("Please verify your phone number first.");
        return;
    }

    if (!otp) {
        setRegError("Please enter the OTP sent to your phone.");
        return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setIsRegistering(true);

    try {
      const newPatientData = {
        name: regName,
        age: parseInt(regAge),
        gender: regGender,
        phone: regPhone,
        address: regAddress,
        password: regPassword,
        otp: otp // Send OTP to backend
      };

      const result = await api.auth.registerPatient(newPatientData);
      onRegister(result);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-center text-indigo-700 mb-4">Patient Portal</h3>
      <div className="flex border-b mb-4">
        <button onClick={() => setTab('signin')} className={`flex-1 py-2 font-semibold ${tab === 'signin' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Sign In</button>
        <button onClick={() => setTab('register')} className={`flex-1 py-2 font-semibold ${tab === 'register' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Register</button>
      </div>

      {tab === 'signin' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          {signInError && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-lg">{signInError}</p>}
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Phone Number (10 digits)" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Password" required />
          <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 flex justify-center" disabled={isSigningIn}>
            {isSigningIn ? <LoaderCircle className="animate-spin w-5 h-5"/> : 'Sign In'}
          </button>
        </form>
      )}

      {tab === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4">
          {regError && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-lg">{regError}</p>}
          
          <input type="text" placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" required />
          
          {/* PHONE INPUT WITH OTP BUTTON */}
          <div className="flex gap-2">
              <input 
                type="tel" 
                placeholder="Phone (10 digits)" 
                value={regPhone} 
                onChange={(e) => setRegPhone(e.target.value)} 
                className={`flex-grow p-2 border rounded-lg ${otpSent ? 'bg-gray-100 text-gray-500' : 'border-gray-300'}`}
                maxLength="10"
                disabled={otpSent} // Disable after OTP is sent
                required 
              />
              {!otpSent ? (
                  <button 
                    type="button" 
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || regPhone.length !== 10}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-indigo-700 whitespace-nowrap flex items-center"
                  >
                    {isSendingOtp ? <LoaderCircle className="animate-spin w-4 h-4"/> : <><Send className="w-4 h-4 mr-1"/> OTP</>}
                  </button>
              ) : (
                  <div className="flex items-center text-green-600 font-bold px-3">
                      <CheckCircle className="w-5 h-5 mr-1"/> Sent
                  </div>
              )}
          </div>

          {/* OTP INPUT - Only shows after sending */}
          {otpSent && (
              <div className="animate-slide-in">
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    className="w-full p-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 font-mono text-center tracking-widest" 
                    maxLength="6"
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">Check your console or phone for code.</p>
              </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Age" value={regAge} onChange={(e) => setRegAge(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" required />
            <select value={regGender} onChange={(e) => setRegGender(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
          
          <input type="text" placeholder="Address" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
          <input type="password" placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" required />
          <input type="password" placeholder="Confirm Password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" required />

          <button 
            type="submit" 
            className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition duration-150 disabled:opacity-50"
            disabled={isRegistering || !otpSent}
          >
            {isRegistering ? 'Verifying & Creating...' : 'Register'}
          </button>
        </form>
      )}
    </div>
  );
};

export default PatientLogin;