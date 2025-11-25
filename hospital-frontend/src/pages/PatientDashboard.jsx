import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AppointmentScheduler from '../components/AppointmentScheduler';
import { Calendar, Star, X, CreditCard, FileText, Activity, Pill, Download, CheckCircle } from 'lucide-react'; 
import { getDoctorName } from '../mockData';
import { api } from '../services/api'; 

const PatientDashboard = ({ userId, data, onSchedule, onUpdate }) => {
  const [bills, setBills] = useState([]);
  const [records, setRecords] = useState([]); 
  const [isLoadingBills, setIsLoadingBills] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true); 

  const patient = data?.patients?.find(p => p.patient_id === userId);
  const patientAppointments = data?.appointments
    ?.filter(a => a.patient_id === userId)
    ?.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)) || [];

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const billsData = await api.billing.getForPatient(userId);
        setBills(billsData);
      } catch (error) { console.error("Failed to fetch bills", error); } 
      finally { setIsLoadingBills(false); }

      try {
        const historyData = await api.patients.getHistory(userId);
        setRecords(historyData);
      } catch (error) { console.error("Failed to fetch records", error); }
      finally { setIsLoadingRecords(false); }
    };

    fetchData();
  }, [userId]);

  // --- HANDLE EXPORT (NEW) ---
  const handleExport = () => {
    if (!patient) return;

    let content = `🏥 MEDICAL REPORT SUMMARY\n`;
    content += `Patient: ${patient.name}\n`;
    content += `Phone: ${patient.phone}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `================================================\n\n`;

    content += `📋 MEDICAL HISTORY (${records.length} Records)\n`;
    records.forEach((rec, i) => {
        content += `\n[${i+1}] Date: ${rec.visit_date.split('T')[0]} | Dr. ${rec.doctor_name}\n`;
        content += `    Diagnosis: ${rec.diagnosis}\n`;
        content += `    Treatment: ${rec.treatment_plan}\n`;
        content += `    Notes: ${rec.notes || 'N/A'}\n`;
        if (rec.medicines && rec.medicines.length > 0) {
            content += `    💊 Prescriptions:\n`;
            rec.medicines.forEach(m => content += `       - ${m.name}: ${m.dosage} (${m.duration})\n`);
        }
        content += `------------------------------------------------`;
    });

    content += `\n\n💳 BILLING HISTORY (${bills.length} Invoices)\n`;
    bills.forEach((bill, i) => {
        content += `\n[${i+1}] Date: ${bill.bill_date.split('T')[0]}\n`;
        content += `    Amount: ₹${bill.amount}\n`;
        content += `    Status: ${bill.status}\n`;
    });

    // Create and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MedicalReport_${patient.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- APPOINTMENT UPDATE ---
  const handleUpdateAppointment = async (appointmentId, updateData) => {
    onUpdate(prevData => {
        const newAppointments = prevData.appointments.map(a =>
            a.appointment_id === appointmentId ? { ...a, ...updateData } : a
        );
        return { ...prevData, appointments: newAppointments };
    });
    try { await api.appointments.update(appointmentId, updateData); } catch (error) { console.error(error); }
  };

  if (!patient) return <Card title="Loading..."><p>Fetching profile...</p></Card>;

  const upcomingCount = patientAppointments.filter(a => a.status === 'Scheduled').length;
  const completedCount = patientAppointments.filter(a => a.status === 'Completed').length;
  const unpaidBillsCount = bills.filter(b => b.status === 'Unpaid').length;

  return (
    <div className="space-y-8">
      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Hello, {patient.name} 👋</h2>
            <p className="text-indigo-100 text-lg">Here is your daily health overview.</p>
        </div>
        <div className="relative z-10 flex gap-3 mt-4 md:mt-0">
             {patient.compliance_score !== undefined && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
                    <Activity className="w-5 h-5 text-emerald-300" />
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">Compliance Score</p>
                        <p className="font-bold text-lg leading-none">{patient.compliance_score}</p>
                    </div>
                </div>
            )}
            <button onClick={handleExport} className="bg-white text-indigo-600 px-5 py-2 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg flex items-center gap-2">
                <Download className="w-4 h-4" /> Report
            </button>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
            { label: 'Upcoming', val: upcomingCount, color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar },
            { label: 'Completed', val: completedCount, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
            { label: 'Records', val: records.length, color: 'text-violet-600', bg: 'bg-violet-50', icon: FileText },
            { label: 'Due Bills', val: unpaidBillsCount, color: 'text-rose-600', bg: 'bg-rose-50', icon: CreditCard },
        ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-800">{stat.val}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                </div>
            </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
             <AppointmentScheduler
                patientId={userId}
                doctors={data?.doctors || []}
                onSchedule={onSchedule}
            />

            {/* MEDICAL HISTORY */}
            <Card title="Medical History" icon={FileText}>
                {isLoadingRecords ? (
                    <p className="text-slate-400 p-4 text-center">Loading records...</p>
                ) : records.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                        <p className="text-slate-500 font-medium">No diagnosis records found.</p>
                    </div>
                ) : (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {records.map(rec => (
                            <div key={rec.record_id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-indigo-100 transition-colors">
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{rec.diagnosis}</h4>
                                        <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">{rec.visit_date.split('T')[0]} • Dr. {rec.doctor_name}</p>
                                    </div>
                                    {rec.file_path && (
                                        <a href={`http://localhost:3001${rec.file_path}`} target="_blank" rel="noreferrer" className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 font-bold hover:bg-indigo-50 transition">
                                            📎 File
                                        </a>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-4 text-sm mb-4">
                                    {rec.notes && (
                                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-slate-700">
                                            <span className="font-bold text-amber-700 text-xs uppercase mr-2">Notes</span>
                                            {rec.notes}
                                        </div>
                                    )}
                                    {rec.treatment_plan && (
                                        <p className="text-slate-600 px-2"><span className="font-bold text-slate-800">Plan:</span> {rec.treatment_plan}</p>
                                    )}
                                </div>
                                {rec.medicines && rec.medicines.length > 0 && (
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-slate-100 text-slate-500 text-xs uppercase">
                                                <tr><th className="px-4 py-2 text-left">Rx</th><th className="px-4 py-2 text-left">Dosage</th><th className="px-4 py-2 text-left">Duration</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {rec.medicines.map((med, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 font-bold text-slate-700">{med.name}</td>
                                                        <td className="px-4 py-2 text-indigo-600 font-mono text-xs font-bold">{med.dosage}</td>
                                                        <td className="px-4 py-2 text-slate-500 text-xs">{med.duration || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card title="Billing History" icon={CreditCard}>
                {isLoadingBills ? <p className="text-center text-slate-400 py-4">Loading...</p> : bills.length === 0 ? <p className="text-center text-slate-400 py-8">No bills found.</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                                <tr><th className="px-6 py-3 text-left">Date</th><th className="px-6 py-3 text-left">Amount</th><th className="px-6 py-3 text-left">Status</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {bills.map(b => (
                                    <tr key={b.bill_id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 font-medium text-slate-600">{b.bill_date.split('T')[0]}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">₹{b.amount}</td>
                                        <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${b.status==='Paid'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>{b.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1">
            <Card title="My Appointments" icon={Calendar} className="h-full">
                {patientAppointments.length === 0 ? <p className="text-slate-400 text-center py-12">No appointments.</p> : (
                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {patientAppointments.map(a => (
                            <div key={a.appointment_id} className={`p-5 rounded-2xl border transition-all hover:shadow-md ${a.is_emergency?'bg-rose-50 border-rose-100':'bg-white border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg">{a.appointment_date}</p>
                                        <p className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md w-fit mt-1">{a.appointment_time ? a.appointment_time.slice(0,5) : 'Time N/A'}</p>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${a.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {a.status}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-600 mb-4">Dr. {getDoctorName(a.doctor_id)}</p>
                                
                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                    {a.status === 'Scheduled' && (
                                        <button onClick={() => handleUpdateAppointment(a.appointment_id, { status: 'Cancelled' })} className="text-xs text-rose-500 font-bold hover:bg-rose-50 px-2 py-1 rounded transition flex items-center">
                                            <X className="w-3 h-3 mr-1"/> Cancel
                                        </button>
                                    )}
                                    {a.status === 'Completed' && (
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Rate</span>
                                            <StarRating rating={a.doctor_rating || 0} onRate={(r) => handleUpdateAppointment(a.appointment_id, { doctor_rating: r })} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
};

const StarRating = ({ rating, onRate }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => {
        const v = i + 1;
        return (
          <label key={i}><input type="radio" className="hidden" onClick={()=>onRate(v)}/><Star className={`w-4 h-4 cursor-pointer transition-transform hover:scale-110 ${v<=(hover||rating)?'fill-amber-400 text-amber-400':'text-slate-200'}`} onMouseEnter={()=>setHover(v)} onMouseLeave={()=>setHover(0)}/></label>
        );
      })}
    </div>
  );
};

export default PatientDashboard;