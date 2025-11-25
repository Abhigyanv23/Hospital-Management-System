import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react'; 
import Card from './Card'; 

const API_BASE_URL = 'http://localhost:3001/api';

const AppointmentScheduler = ({ patientId, doctors, onSchedule }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState(''); 
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // --- DEBUGGING: Check what data we are receiving ---
  useEffect(() => {
    if (doctors && doctors.length > 0) {
        console.log("👨‍⚕️ DOCTOR DATA DEBUG:", doctors);
        console.log("⭐ First Doctor Rating:", doctors[0].average_rating);
    }
  }, [doctors]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 10; hour <= 22; hour++) {
      const timeValue = `${hour.toString().padStart(2, '0')}:00`;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      const label = `${displayHour}:00 ${ampm}`;
      slots.push({ value: timeValue, label: label });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !appointmentDate || !appointmentTime) return;

    setIsSubmitting(true);
    setError('');

    const newAppointmentData = {
      patient_id: patientId,
      doctor_id: parseInt(selectedDoctorId),
      appointment_date: appointmentDate,
      appointment_time: appointmentTime, 
      is_emergency: isEmergency,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointmentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to book appointment.');
      }

      onSchedule(result);
      setSelectedDoctorId('');
      setAppointmentDate('');
      setAppointmentTime(''); 
      setIsEmergency(false);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card title="Schedule New Appointment" icon={Calendar} className="col-span-1 md:col-span-2 border-t-4 border-t-indigo-500">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {error && (
          <div className="col-span-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center text-sm font-medium">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* 1. Doctor Selection */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            required
            disabled={isSubmitting}
          >
            <option value="" disabled>-- Choose Specialist --</option>
            
            {doctors.map(d => {
              // SAFE RATING CHECK
              let ratingDisplay = '(New)';
              
              // Check if property exists and is not null
              if (d.average_rating !== undefined && d.average_rating !== null) {
                  const num = parseFloat(d.average_rating);
                  if (!isNaN(num) && num > 0) {
                      ratingDisplay = `⭐ ${num.toFixed(1)}`;
                  }
              }

              return (
                <option key={d.doctor_id} value={d.doctor_id}>
                  {d.name} ({d.specialization}) {ratingDisplay}
                </option>
              );
            })}

          </select>
        </div>

        {/* 2. Date Selection */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            min={today} 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* 3. Time Selection */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
          <div className="relative">
            <select
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 pl-9 appearance-none bg-white"
              required
              disabled={isSubmitting}
            >
              <option value="" disabled>-- Select Hour --</option>
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 4. Submit */}
        <div className="col-span-1 flex items-end gap-2">
          <label className={`flex items-center justify-center px-3 py-2 rounded border cursor-pointer transition-colors h-[42px] ${isEmergency ? 'bg-red-100 border-red-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mr-2"
              disabled={isSubmitting}
            />
            <span className={`text-xs font-bold ${isEmergency ? 'text-red-700' : 'text-gray-600'}`}>
               Urgent
            </span>
          </label>
            
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-grow h-[42px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md disabled:opacity-50 font-semibold text-sm"
          >
            {isSubmitting ? 'Booking...' : 'Confirm'}
          </button>
        </div>

      </form>
    </Card>
  );
};

export default AppointmentScheduler;