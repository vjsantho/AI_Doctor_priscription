import { useState } from "react";
import { toast } from "sonner";

type Doctor = {
    id: string;
    name: string;
    specialty: string;
    availability: string[];
    image: string;
};

type Appointment = {
    id: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    status: "scheduled" | "completed" | "cancelled";
    type: "Check-up" | "Follow-up" | "Consultation";
};

const MOCK_DOCTORS: Doctor[] = [
    {
        id: "d1",
        name: "Dr. Sarah Chen",
        specialty: "Cardiologist",
        availability: ["09:00 AM", "10:00 AM", "02:00 PM", "03:30 PM"],
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"
    },
    {
        id: "d2",
        name: "Dr. Michael Ross",
        specialty: "Neurologist",
        availability: ["11:00 AM", "01:00 PM", "04:00 PM"],
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop"
    },
    {
        id: "d3",
        name: "Dr. Emily Watsons",
        specialty: "General Physician",
        availability: ["09:30 AM", "10:30 AM", "11:30 AM", "02:30 PM"],
        image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1974&auto=format&fit=crop"
    }
];

const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: "a1",
        doctorId: "d1",
        doctorName: "Dr. Sarah Chen",
        date: "2024-03-15",
        time: "09:00 AM",
        status: "scheduled",
        type: "Check-up"
    },
    {
        id: "a2",
        doctorId: "d3",
        doctorName: "Dr. Emily Watsons",
        date: "2024-02-28",
        time: "10:30 AM",
        status: "completed",
        type: "Consultation"
    }
];

export function AppointmentBooking() {
    const [view, setView] = useState<"book" | "history" | "availability">("book");
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
    const [reschedulingId, setReschedulingId] = useState<string | null>(null);

    const handleBookAppointment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor || !selectedDate || !selectedTime) {
            toast.error("Please select a doctor, date, and time");
            return;
        }

        if (reschedulingId) {
            setAppointments(appointments.map(app =>
                app.id === reschedulingId
                    ? { ...app, date: selectedDate, time: selectedTime, doctorId: selectedDoctor.id, doctorName: selectedDoctor.name, status: "scheduled" }
                    : app
            ));
            toast.success("Appointment rescheduled successfully");
            setReschedulingId(null);
        } else {
            const newAppointment: Appointment = {
                id: Math.random().toString(36).substr(2, 9),
                doctorId: selectedDoctor.id,
                doctorName: selectedDoctor.name,
                date: selectedDate,
                time: selectedTime,
                status: "scheduled",
                type: "Consultation"
            };
            setAppointments([...appointments, newAppointment]);
            toast.success("Appointment booked successfully");
        }

        setView("history");
        setSelectedDoctor(null);
        setSelectedDate("");
        setSelectedTime("");
    };

    const handleCancelAppointment = (id: string) => {
        if (confirm("Are you sure you want to cancel this appointment?")) {
            setAppointments(appointments.map(app =>
                app.id === id ? { ...app, status: "cancelled" } : app
            ));
            toast.info("Appointment cancelled");
        }
    };

    const handleReschedule = (appointment: Appointment) => {
        const doctor = MOCK_DOCTORS.find(d => d.id === appointment.doctorId);
        if (doctor) {
            setSelectedDoctor(doctor);
            setSelectedDate(appointment.date);
            setReschedulingId(appointment.id);
            setView("book");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex space-x-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => {
                        setView("book");
                        setReschedulingId(null);
                        setSelectedDoctor(null);
                    }}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${view === "book" ? "text-primary" : "text-text-muted hover:text-white"
                        }`}
                >
                    Book Appointment
                    {view === "book" && (
                        <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-t-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setView("history")}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${view === "history" ? "text-primary" : "text-text-muted hover:text-white"
                        }`}
                >
                    Visit History
                    {view === "history" && (
                        <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-t-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setView("availability")}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${view === "availability" ? "text-primary" : "text-text-muted hover:text-white"
                        }`}
                >
                    Doctor Availability
                    {view === "availability" && (
                        <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-t-full"></span>
                    )}
                </button>
            </div>

            {view === "book" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold text-white mb-6">
                        {reschedulingId ? "Reschedule Appointment" : "New Appointment"}
                    </h3>
                    <form onSubmit={handleBookAppointment} className="space-y-6 max-w-2xl">
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-text-muted">Select Doctor</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_DOCTORS.map((doctor) => (
                                    <div
                                        key={doctor.id}
                                        onClick={() => setSelectedDoctor(doctor)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedDoctor?.id === doctor.id
                                                ? "bg-primary/20 border-primary"
                                                : "bg-section-darker border-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <img src={doctor.image} alt={doctor.name} className="w-12 h-12 rounded-full object-cover" />
                                            <div>
                                                <div className="font-semibold text-white">{doctor.name}</div>
                                                <div className="text-xs text-text-muted">{doctor.specialty}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedDoctor && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-muted">Date</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 rounded-lg bg-section-darker border border-white/10 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-muted">Available Time Slots</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedDoctor.availability.map((time) => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${selectedTime === time
                                                            ? "bg-primary text-white border-primary"
                                                            : "bg-section-darker border-white/10 text-text-muted hover:border-white/30"
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-glow"
                        >
                            {reschedulingId ? "Confirm Reschedule" : "Book Appointment"}
                        </button>
                    </form>
                </div>
            )}

            {view === "history" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                    <h3 className="text-xl font-bold text-white mb-6">Visit History</h3>
                    {appointments.length === 0 ? (
                        <div className="text-center py-12 text-text-muted">No appointments found.</div>
                    ) : (
                        appointments.map((app) => (
                            <div key={app.id} className="bg-section-darker border border-white/10 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${app.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                            app.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                                'bg-blue-500/20 text-blue-500'
                                        }`}>
                                        {app.status === 'completed' ? '✓' : app.status === 'cancelled' ? '✕' : '📅'}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">{app.doctorName}</div>
                                        <div className="text-sm text-text-muted">{app.type} • {app.date} at {app.time}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-medium ${app.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            app.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                        {app.status}
                                    </span>

                                    {app.status === 'scheduled' && (
                                        <div className="flex gap-2 ml-auto md:ml-0">
                                            <button
                                                onClick={() => handleReschedule(app)}
                                                className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Reschedule"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                onClick={() => handleCancelAppointment(app.id)}
                                                className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Cancel"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === "availability" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold text-white mb-6">Doctor Availability</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {MOCK_DOCTORS.map((doctor) => (
                            <div key={doctor.id} className="bg-section-darker border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all">
                                <div className="flex items-start gap-4 mb-6">
                                    <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{doctor.name}</h4>
                                        <p className="text-primary text-sm">{doctor.specialty}</p>
                                        <p className="text-text-muted text-xs mt-1">15+ Years Experience</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Today's Slots</div>
                                    <div className="flex flex-wrap gap-2">
                                        {doctor.availability.map(slot => (
                                            <span key={slot} className="px-3 py-1 bg-white/5 rounded-md text-xs text-text-muted border border-white/5 hover:border-white/20 cursor-default">
                                                {slot}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedDoctor(doctor);
                                        setView("book");
                                    }}
                                    className="w-full mt-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                                >
                                    Book with {doctor.name.split(' ')[1]}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
