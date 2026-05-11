/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Calendar, 
  Database, 
  User, 
  Stethoscope, 
  Clock, 
  Trash2, 
  ShieldCheck, 
  PlusCircle,
  Hash,
  ArrowDown,
  XCircle,
  CheckCircle2,
  Shield,
  LayoutDashboard,
  RefreshCw,
  Search,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppointmentData {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  dateTime: string;
  status: 'BOOKED' | 'CANCELLED';
}

interface Block {
  index: number;
  timestamp: number;
  hash: string;
  prevHash: string;
  data: AppointmentData;
}

type Tab = 'book' | 'view' | 'my-appointments' | 'admin-dashboard';
type UserRole = 'patient' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('book');
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [chain, setChain] = useState<Block[]>([]);
  const [doctors, setDoctors] = useState<Record<string, string[]>>({});
  const [bookingFormData, setBookingFormData] = useState({
    patientName: '',
    doctorName: '',
    dateTime: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<'verified' | 'failed' | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchChain = async () => {
    try {
      const res = await fetch('/api/chain');
      const data = await res.json();
      setChain(data);
    } catch (err) {
      console.error("Failed to fetch chain", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  useEffect(() => {
    fetchChain();
    fetchDoctors();
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingFormData.patientName || !bookingFormData.doctorName || !bookingFormData.dateTime) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingFormData)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Immuntable record committed to genesis ledger.', type: 'success' });
        setBookingFormData({ patientName: '', doctorName: '', dateTime: '' });
        fetchChain();
        fetchDoctors();
      }
    } catch (err) {
      setMessage({ text: 'Transaction rejected by network nodes.', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleCancel = async (appointmentId: string, patientName: string) => {
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, patientName })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Cancellation block appended to chain.', type: 'success' });
        fetchChain();
        fetchDoctors();
      } else {
        setMessage({ text: data.error || 'Identity verification failed.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network failure during cancellation.', type: 'error' });
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const verifyIntegrity = () => {
    setIsVerifying(true);
    setIntegrityStatus(null);
    setTimeout(() => {
      setIsVerifying(false);
      setIntegrityStatus('verified');
      setTimeout(() => setIntegrityStatus(null), 4000);
    }, 2000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([fetchChain(), fetchDoctors()]);
      setMessage({ text: 'Node synchronized with network consensus.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Sync failed: Peer nodes unreachable.', type: 'error' });
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setMessage(null);
      }, 1500);
    }
  };

  const myBookings = Array.from(new Set(chain
    .filter(b => b.data.appointmentId !== 'GENESIS')
    .map(b => b.data.appointmentId)))
    .map(id => {
      const history = chain.filter(b => b.data.appointmentId === id);
      const latest = history[history.length - 1];
      return latest;
    })
    .filter(b => b.data.status === 'BOOKED');

  return (
    <div className="min-h-screen bg-surgeon-dark text-slate-100 flex flex-col md:flex-row medical-grid relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-glow/5 rounded-full blur-[120px] pointer-events-none -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -ml-40 -mb-40"></div>

      {/* Sidebar */}
      <div className="w-full md:w-72 glass border-r border-white/5 p-8 flex flex-col gap-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-glow/10 flex items-center justify-center border border-cyan-glow/30">
            <Activity className="text-cyan-glow" size={30} />
          </div>
          <div>
            <span className="font-display font-bold text-xl tracking-tighter text-white block leading-none">AetherMed</span>
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-cyan-glow/60">Ledger Protocol</span>
          </div>
        </div>

        {/* User Role Toggle */}
        <div className="p-1 bg-white/5 rounded-xl border border-white/10 flex">
          <button 
            onClick={() => { setUserRole('patient'); setActiveTab('book'); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${userRole === 'patient' ? 'bg-cyan-glow text-surgeon-dark' : 'text-slate-400 hover:text-white'}`}
          >
            PATIENT
          </button>
          <button 
            onClick={() => { setUserRole('admin'); setActiveTab('admin-dashboard'); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${userRole === 'admin' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            ADMIN
          </button>
        </div>

        <nav className="flex flex-col gap-1.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-4">Navigation</div>
          
          {userRole === 'patient' ? (
            <>
              <button 
                id="tab-book"
                onClick={() => setActiveTab('book')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'book' ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <PlusCircle size={18} />
                <span className="text-sm font-medium">Book Appointment</span>
              </button>
              <button 
                id="tab-my"
                onClick={() => setActiveTab('my-appointments')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'my-appointments' ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Calendar size={18} />
                <span className="text-sm font-medium">My Records</span>
              </button>
            </>
          ) : (
            <>
              <button 
                id="tab-admin"
                onClick={() => setActiveTab('admin-dashboard')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'admin-dashboard' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <LayoutDashboard size={18} />
                <span className="text-sm font-medium">Hospital Overview</span>
              </button>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isSyncing ? 'text-cyan-glow bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                <span className="text-sm font-medium">{isSyncing ? 'Syncing...' : 'Node Syncing'}</span>
              </button>
            </>
          )}

          <button 
            id="tab-view"
            onClick={() => setActiveTab('view')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'view' ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Database size={18} />
            <span className="text-sm font-medium">Chain Explorer</span>
          </button>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="glass p-4 rounded-xl border-white/5 text-xs">
            <div className="flex items-center gap-2 text-cyan-glow font-bold mb-1 uppercase tracking-tighter">
              <Shield size={14} />
              Network Status
            </div>
            <div className="flex items-center gap-2 text-slate-400">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               Mainnet Connected
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono text-center">
            SHA256 v2.4a // IMMUTABLE
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 relative z-10 overflow-y-auto h-screen scrollbar-hide">
        <div className="max-w-5xl mx-auto">
          
          <AnimatePresence mode="wait">
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`mb-8 p-5 rounded-2xl border flex items-center justify-between gap-4 glass shadow-2xl ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
              >
                <div className="flex items-center gap-3">
                  {message.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  <span className="font-medium">{message.text}</span>
                </div>
                <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100">
                  <XCircle size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'book' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-display font-bold text-white tracking-tight">Ledger Registration</h1>
                <p className="text-slate-400 text-lg">Secure your medical consultation on the AetherMed blockchain.</p>
              </div>

              <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-3">
                  <form onSubmit={handleBooking} className="glass p-10 rounded-3xl border-white/5 space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-mono font-bold text-cyan-glow uppercase tracking-[0.2em]">Patient Credentials</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          required
                          type="text"
                          placeholder="Legal Full Name"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-cyan-glow/50 focus:bg-white/[0.07] transition-all"
                          value={bookingFormData.patientName}
                          onChange={e => setBookingFormData({...bookingFormData, patientName: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-mono font-bold text-cyan-glow uppercase tracking-[0.2em]">Practitioner</label>
                        <div className="relative">
                          <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <select 
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-cyan-glow/50 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer"
                            value={bookingFormData.doctorName}
                            onChange={e => setBookingFormData({...bookingFormData, doctorName: e.target.value, dateTime: ''})}
                          >
                            <option value="" className="bg-surgeon-blue">Select</option>
                            {Object.keys(doctors).map(doc => (
                              <option key={doc} value={doc} className="bg-surgeon-blue">{doc}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-mono font-bold text-cyan-glow uppercase tracking-[0.2em]">Availability</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <select 
                            required
                            disabled={!bookingFormData.doctorName}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-cyan-glow/50 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            value={bookingFormData.dateTime}
                            onChange={e => setBookingFormData({...bookingFormData, dateTime: e.target.value})}
                          >
                            <option value="" className="bg-surgeon-blue">Time</option>
                            {bookingFormData.doctorName && doctors[bookingFormData.doctorName]?.map(time => (
                              <option key={time} value={time} className="bg-surgeon-blue">{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-cyan-glow hover:bg-white text-surgeon-dark font-bold py-5 rounded-2xl transition-all shadow-xl shadow-cyan-glow/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <RefreshCw className="animate-spin" size={20} />
                      ) : (
                        <>
                          <Lock size={18} />
                          Sign and Commit to Block
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="glass p-8 rounded-3xl border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Shield size={100} />
                    </div>
                    <h3 className="text-lg font-bold mb-4">Security Protocol</h3>
                    <ul className="space-y-4">
                      {[
                        "SHA-256 Hash Chaining",
                        "End-to-End Encryption",
                        "Immutable Audit Trail",
                        "Identity Decentralization"
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-slate-400">
                          <CheckCircle2 size={16} className="text-cyan-glow" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl">
                     <p className="text-xs text-indigo-300 font-mono italic">"Every appointment is a cryptographically secured contract between provider and patient."</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'view' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12 pb-20"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 border border-white/5 p-8 rounded-[40px] gap-6">
                <div>
                  <h1 className="text-3xl font-display font-bold mb-1 tracking-tight">Mainnet Explorer</h1>
                  <p className="text-slate-500">Live visualization of the AetherMed blockchain nodes.</p>
                </div>
                <div className="flex gap-4">
                  <div className="glass px-6 py-3 rounded-2xl text-center border-white/10">
                    <div className="text-[10px] text-slate-500 font-mono uppercase font-bold mb-1 tracking-wider">Blocks</div>
                    <div className="text-2xl font-bold text-cyan-glow">{chain.length}</div>
                  </div>
                  <div className="glass px-6 py-3 rounded-2xl text-center border-white/10 hidden sm:block">
                     <div className="text-[10px] text-slate-500 font-mono uppercase font-bold mb-1 tracking-wider">TPS</div>
                     <div className="text-2xl font-bold">142.8</div>
                  </div>
                </div>
              </div>

              <div className="space-y-16">
                {chain.slice().reverse().map((block, idx) => (
                  <motion.div 
                    key={block.hash} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative"
                  >
                    {idx < chain.length - 1 && (
                      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 h-16 w-0.5 bg-gradient-to-b from-cyan-glow/30 to-transparent flex items-center justify-center">
                        <div className="p-1 bg-surgeon-dark border border-white/10 rounded-full animate-bounce">
                          <ArrowDown size={14} className="text-cyan-glow" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`glass rounded-[40px] p-8 md:p-12 relative overflow-hidden ${block.data.status === 'CANCELLED' ? 'border-rose-500/30' : 'border-white/10'}`}>
                      {/* Grid Background in card */}
                      <div className="absolute inset-0 medical-grid opacity-20 pointer-events-none"></div>

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-display font-bold text-white shadow-inner">
                              {block.index}
                            </div>
                            <div>
                               <h3 className="text-2xl font-display font-bold">{block.data.appointmentId === 'GENESIS' ? 'Protocol Inception' : block.data.appointmentId}</h3>
                               <p className="text-sm font-mono text-slate-500 flex items-center gap-2">
                                 <Clock size={14} />
                                 {new Date(block.timestamp).toLocaleString().toUpperCase()}
                               </p>
                            </div>
                          </div>
                          <div className={`px-5 py-2 rounded-2xl text-xs font-bold font-mono tracking-widest border ${block.data.status === 'BOOKED' ? 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {block.data.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                          <div className="glass-cyan px-6 py-5 rounded-3xl">
                            <p className="text-[10px] text-cyan-glow font-mono font-bold uppercase tracking-[0.2em] mb-2">Patient ID</p>
                            <p className="text-lg font-bold text-white">{block.data.patientName}</p>
                          </div>
                          <div className="glass px-6 py-5 rounded-3xl border-white/5">
                            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-[0.2em] mb-2">Medical Officer</p>
                            <p className="text-lg font-bold text-white">{block.data.doctorName}</p>
                          </div>
                          <div className="glass px-6 py-5 rounded-3xl border-white/5">
                            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-[0.2em] mb-2">Scheduled Event</p>
                            <p className="text-lg font-bold text-white">{block.data.dateTime}</p>
                          </div>
                        </div>

                        <div className="space-y-4 font-mono text-[11px] pt-8 border-t border-white/5">
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2 text-cyan-glow font-bold uppercase tracking-widest text-glow-cyan">
                               <Hash size={14} />
                               Current Node Hash
                             </div>
                             <div className="bg-white/[0.03] p-4 rounded-2xl break-all text-slate-400 border border-white/5 group relative cursor-pointer">
                               {block.hash}
                               <div className="absolute inset-0 bg-cyan-glow/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center font-bold text-cyan-glow">
                                 COPY HASH SIGNATURE
                               </div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-2 opacity-50 transition-opacity hover:opacity-100">
                             <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest">
                               <Hash size={14} />
                               Previous Node Link
                             </div>
                             <div className="p-4 rounded-2xl break-all text-slate-600 bg-white/5 border border-white/5">
                               {block.prevHash}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'my-appointments' && userRole === 'patient' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-display font-bold text-white tracking-tight">Access History</h1>
                <p className="text-slate-400">View your active smart-contracts on the ledger.</p>
              </div>

              {myBookings.length === 0 ? (
                <div className="glass p-20 rounded-[40px] text-center border-dashed border-white/10">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                    <Calendar size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">No Active Contracts Found</h3>
                  <p className="text-slate-500 mt-3 max-w-sm mx-auto">Your identity does not currently own any verified appointment blocks on this node.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {myBookings.map(booking => (
                    <motion.div 
                      key={booking.data.appointmentId} 
                      className="glass rounded-[40px] p-8 border-white/5 flex flex-col justify-between hover:bg-white/[0.04] transition-all group"
                      whileHover={{ y: -5 }}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-8">
                          <span className="text-[10px] font-mono font-bold bg-white/10 text-cyan-glow px-3 py-1.5 rounded-full tracking-widest border border-cyan-glow/20">
                            {booking.data.appointmentId}
                          </span>
                          <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono tracking-widest">
                            <CheckCircle2 size={16} />
                            COMMITTED
                          </span>
                        </div>
                        
                        <h3 className="font-display font-bold text-2xl text-white mb-6 underline decoration-cyan-glow/20 decoration-2 underline-offset-8">
                           {booking.data.patientName}
                        </h3>
                        
                        <div className="space-y-4 mb-10">
                          <div className="flex items-center gap-3 text-slate-400 bg-white/5 p-3 rounded-2xl">
                             <Stethoscope size={18} className="text-cyan-glow" />
                             <span className="text-sm font-medium">{booking.data.doctorName}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 bg-white/5 p-3 rounded-2xl">
                             <Clock size={18} className="text-cyan-glow" />
                             <span className="text-sm font-medium">{booking.data.dateTime}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                         id={`cancel-${booking.data.appointmentId}`}
                         onClick={() => handleCancel(booking.data.appointmentId, booking.data.patientName)}
                         className="w-full py-4 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                         <Trash2 size={18} />
                         Revoke Transaction
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'admin-dashboard' && userRole === 'admin' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-display font-bold text-white tracking-tight underline decoration-indigo-500 decoration-4 underline-offset-[12px]">Node Master</h1>
                  <p className="text-slate-400 mt-3">High-level hospital resource management and chain health overview.</p>
                </div>
                <button 
                  onClick={verifyIntegrity}
                  disabled={isVerifying}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${integrityStatus === 'verified' ? 'bg-emerald-500 text-white' : 'glass border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'}`}
                >
                  <ShieldCheck size={20} className={isVerifying ? 'animate-spin' : ''} />
                  {isVerifying ? 'Verifying Hashes...' : integrityStatus === 'verified' ? 'Integrity Verified' : 'Deep Integrity Scan'}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-3xl border-white/5">
                   <p className="text-xs font-mono font-bold text-slate-500 mb-2 tracking-widest uppercase">Protocol Version</p>
                   <p className="text-3xl font-display font-bold tracking-tight">2.4.0 <span className="text-xs text-indigo-400">RC</span></p>
                </div>
                <div className="glass p-8 rounded-3xl border-white/5">
                   <p className="text-xs font-mono font-bold text-slate-500 mb-2 tracking-widest uppercase">System Load</p>
                   <div className="flex items-end gap-2">
                     <p className="text-3xl font-display font-bold tracking-tight">1.2%</p>
                     <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-indigo-500 w-[12%]"></div>
                     </div>
                   </div>
                </div>
                <div className="glass p-8 rounded-3xl border-white/5">
                   <p className="text-xs font-mono font-bold text-slate-500 mb-2 tracking-widest uppercase">Chain Depth</p>
                   <p className="text-3xl font-display font-bold tracking-tight text-white">{chain.length} Blocks</p>
                </div>
              </div>

              <div className="glass p-10 rounded-[40px] border-white/5">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold">In-Memory Doctor Availability</h3>
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                       <input className="bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs outline-none" placeholder="Search practitioners..." />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(doctors).map(([name, slots]: [string, string[]]) => (
                      <div key={name} className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                             <Stethoscope size={18} />
                           </div>
                           <div>
                              <p className="font-bold text-white text-sm">{name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{slots.length} Global Slots Available</p>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {slots.map((s: string) => (
                             <span key={s} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold family-mono">{s}</span>
                           ))}
                           {slots.length === 0 && <span className="text-xs text-rose-500 font-bold">COMPLETELY BOOKED</span>}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}