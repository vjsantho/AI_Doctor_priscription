import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { AnalysisResults } from "./AnalysisResults";
import { Id } from "../convex/_generated/dataModel";

export function ConsultationHistory() {
  const consultations = useQuery(api.medical.getUserConsultations);
  const [selectedConsultationId, setSelectedConsultationId] = useState<Id<"consultations"> | null>(null);

  if (consultations === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (selectedConsultationId) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <button
          onClick={() => setSelectedConsultationId(null)}
          className="mb-6 px-4 py-2 text-primary hover:text-white flex items-center gap-2 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to History
        </button>
        <AnalysisResults consultationId={selectedConsultationId} />
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">📂</span>
        </div>
        <h2 className="text-xl font-display font-bold text-white mb-2">No Consultations Yet</h2>
        <p className="text-text-muted max-w-sm mx-auto">
          Start your first medical consultation to see your history and AI analysis results here.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Consultation History</h2>
        <p className="text-text-muted">View your previous medical consultations and analyses</p>
      </div>

      <div className="space-y-4">
        {consultations.map((consultation) => {
          const riskColor = consultation.analysis ? {
            "Low": "text-teal-400 bg-teal-400/10 border-teal-400/20",
            "Moderate": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
            "High": "text-orange-400 bg-orange-400/10 border-orange-400/20",
            "CRITICAL": "text-rose-400 bg-rose-400/10 border-rose-400/20"
          }[consultation.analysis.riskLevel] || "text-gray-400 bg-white/5 border-white/10" : "text-gray-400 bg-white/5 border-white/10";

          return (
            <div
              key={consultation._id}
              className="p-5 rounded-xl bg-section-darker border border-white/5 hover:border-primary/20 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedConsultationId(consultation._id)}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                      {consultation.chiefComplaint}
                    </h3>
                    {consultation.isEmergency && (
                      <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-amber-300 bg-amber-300/10 border border-amber-300/20 rounded-full">
                        Action Needed
                      </span>
                    )}
                    {consultation.analysis && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${riskColor}`}>
                        {consultation.analysis.riskLevel} Risk
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted mb-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                      Age: <span className="text-gray-300">{consultation.patientAge}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                      Sex: <span className="text-gray-300 capitalize">{consultation.patientSex}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                      {consultation.symptoms.length} Symptoms
                    </span>
                    <span className="flex items-center gap-1.5 ml-auto md:ml-0">
                      📅 {new Date(consultation._creationTime).toLocaleDateString()}
                    </span>
                  </div>

                  {consultation.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {consultation.symptoms.slice(0, 4).map((symptom, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 text-xs bg-white/5 text-gray-400 border border-white/5 rounded-md"
                        >
                          {symptom.symptom}
                        </span>
                      ))}
                      {consultation.symptoms.length > 4 && (
                        <span className="px-2.5 py-1 text-xs bg-white/5 text-gray-500 border border-white/5 rounded-md">
                          +{consultation.symptoms.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center self-end md:self-center">
                  <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
