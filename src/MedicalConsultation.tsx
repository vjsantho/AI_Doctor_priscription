import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { AnalysisResults } from "./AnalysisResults";
import { VoiceInput } from "./VoiceInput";
import { Id } from "../convex/_generated/dataModel";

interface Symptom {
  symptom: string;
  duration: string;
  severity: string;
  description: string;
}

interface Vitals {
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
}

export function MedicalConsultation() {
  const [patientAge, setPatientAge] = useState<number>(0);
  const [patientSex, setPatientSex] = useState<string>("");
  const [chiefComplaint, setChiefComplaint] = useState<string>("");
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<string>("");
  const [medications, setMedications] = useState<string>("");
  const [vitals, setVitals] = useState<Vitals>({});
  const [currentSymptom, setCurrentSymptom] = useState<Symptom>({
    symptom: "",
    duration: "",
    severity: "",
    description: ""
  });
  const [consultationId, setConsultationId] = useState<Id<"consultations"> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const createConsultation = useMutation(api.medical.createConsultation);

  const addSymptom = () => {
    if (currentSymptom.symptom && currentSymptom.duration && currentSymptom.severity) {
      setSymptoms([...symptoms, currentSymptom]);
      setCurrentSymptom({ symptom: "", duration: "", severity: "", description: "" });
    } else {
      toast.error("Please fill in all required symptom fields");
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientAge || !patientSex || !chiefComplaint || symptoms.length === 0) {
      toast.error("Please fill in all required fields and add at least one symptom");
      return;
    }

    try {
      setIsAnalyzing(true);

      const consultationData = {
        patientAge,
        patientSex,
        chiefComplaint,
        symptoms,
        medicalHistory: medicalHistory || undefined,
        medications: medications || undefined,
        vitals: Object.keys(vitals).length > 0 ? vitals : undefined
      };

      const newConsultationId = await createConsultation(consultationData);
      setConsultationId(newConsultationId);

      toast.success("Analysis started");
    } catch (error) {
      console.error("Error creating consultation:", error);
      toast.error("Failed to create consultation");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setPatientAge(0);
    setPatientSex("");
    setChiefComplaint("");
    setSymptoms([]);
    setMedicalHistory("");
    setMedications("");
    setVitals({});
    setConsultationId(null);
  };

  if (consultationId) {
    return (
      <div>
        <AnalysisResults consultationId={consultationId} />
        <button
          onClick={resetForm}
          className="mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 hover:shadow-glow transition-all duration-300 font-medium"
        >
          Start New Consultation
        </button>
      </div>
    );
  }

  const inputClasses = "w-full px-4 py-3 rounded-lg bg-slate-950/50 backdrop-blur-sm border border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300";
  const labelClasses = "block text-sm font-medium text-text-muted mb-2";

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-display font-bold text-white mb-6">Patient Presentation</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Patient Age *</label>
            <input
              type="number"
              min="0"
              max="120"
              value={patientAge || ""}
              onChange={(e) => setPatientAge(parseInt(e.target.value) || 0)}
              className={inputClasses}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Patient Sex *</label>
            <select
              value={patientSex}
              onChange={(e) => setPatientSex(e.target.value)}
              className={inputClasses}
              required
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Chief Complaint */}
        <div>
          <label className={labelClasses}>Chief Complaint *</label>
          <div className="relative">
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Primary reason for seeking medical attention"
              className={`${inputClasses} pr-12`}
              required
            />
            <VoiceInput
              onResult={(text) => setChiefComplaint(prev => prev ? `${prev} ${text}` : text)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            />
          </div>
        </div>

        {/* Symptoms */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Symptoms *</h3>

          {/* Add Symptom Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Symptom name"
              value={currentSymptom.symptom}
              onChange={(e) => setCurrentSymptom({ ...currentSymptom, symptom: e.target.value })}
              className={inputClasses}
            />

            <select
              value={currentSymptom.duration}
              onChange={(e) => setCurrentSymptom({ ...currentSymptom, duration: e.target.value })}
              className={inputClasses}
            >
              <option value="">Duration</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>

            <select
              value={currentSymptom.severity}
              onChange={(e) => setCurrentSymptom({ ...currentSymptom, severity: e.target.value })}
              className={inputClasses}
            >
              <option value="">Severity</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>

            <button
              type="button"
              onClick={addSymptom}
              className="px-4 py-3 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors font-medium h-full"
            >
              + Add Symptom
            </button>
          </div>

          <div className="relative mb-4">
            <textarea
              placeholder="Additional description"
              value={currentSymptom.description}
              onChange={(e) => setCurrentSymptom({ ...currentSymptom, description: e.target.value })}
              className={`${inputClasses} min-h-[80px]`}
              rows={2}
            />
            <VoiceInput
              onResult={(text) => setCurrentSymptom(prev => ({ ...prev, description: prev.description ? `${prev.description} ${text}` : text }))}
              className="absolute right-2 top-2"
            />
          </div>

          {/* Symptoms List */}
          {symptoms.length > 0 && (
            <div className="space-y-3 mt-6">
              {symptoms.map((symptom, index) => (
                <div key={index} className="flex items-center justify-between glass-card p-4 group">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{symptom.symptom}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-text-muted border border-white/5">
                        {symptom.severity} • {symptom.duration}
                      </span>
                    </div>
                    {symptom.description && (
                      <p className="text-sm text-text-muted mt-1">{symptom.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSymptom(index)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-400/10 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical History & Meds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Medical History</label>
            <div className="relative">
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="Previous medical conditions, surgeries, allergies"
                className={`${inputClasses} min-h-[100px]`}
                rows={3}
              />
              <VoiceInput
                onResult={(text) => setMedicalHistory(prev => prev ? `${prev} ${text}` : text)}
                className="absolute right-2 top-2"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Current Medications</label>
            <div className="relative">
              <textarea
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="List all current medications and dosages"
                className={`${inputClasses} min-h-[100px]`}
                rows={3}
              />
              <VoiceInput
                onResult={(text) => setMedications(prev => prev ? `${prev} ${text}` : text)}
                className="absolute right-2 top-2"
              />
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Vital Signs (optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClasses}>Temperature</label>
              <input
                type="text"
                placeholder="e.g., 98.6°F"
                value={vitals.temperature || ""}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Blood Pressure</label>
              <input
                type="text"
                placeholder="e.g., 120/80"
                value={vitals.bloodPressure || ""}
                onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Heart Rate</label>
              <input
                type="text"
                placeholder="e.g., 72 bpm"
                value={vitals.heartRate || ""}
                onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Respiratory Rate</label>
              <input
                type="text"
                placeholder="e.g., 16/min"
                value={vitals.respiratoryRate || ""}
                onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full px-8 py-4 bg-primary text-white rounded-xl hover:bg-blue-600 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg tracking-wide"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Analysis...
              </span>
            ) : "Analyze Case"}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-text-muted/40">
          AI-generated content. Not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
}
