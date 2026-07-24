import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

interface AnalysisResultsProps {
  consultationId: Id<"consultations">;
}

export function AnalysisResults({ consultationId }: AnalysisResultsProps) {
  const consultation = useQuery(api.medical.getConsultation, { consultationId });
  const [chatMessage, setChatMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatWithAI = useAction(api.medical.chatWithAI);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setIsLoading(true);
    try {
      await chatWithAI({
        consultationId,
        message: chatMessage.trim()
      });
      setChatMessage("");
      toast.success("Message sent to AI assistant");
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  if (!consultation) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (!consultation.analysis) {
    return (
      <div className="bg-section-dark border border-white/5 rounded-2xl p-8 text-center animate-pulse">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Analyzing Data</h3>
            <p className="text-text-muted">Processing symptoms...</p>
          </div>
        </div>
      </div>
    );
  }

  const { analysis } = consultation;
  const riskColor = {
    "Low": "text-teal-400 bg-teal-400/10 border-teal-400/20",
    "Moderate": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    "High": "text-orange-400 bg-orange-400/10 border-orange-400/20",
    "CRITICAL": "text-rose-400 bg-rose-400/10 border-rose-400/20"
  }[analysis.riskLevel] || "text-gray-400 bg-white/5 border-white/10";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Emergency Alert */}
      {/* Emergency Alert (Softened) */}
      {consultation.isEmergency && (
        <div className="bg-amber-900/10 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-amber-500/5 pointer-events-none"></div>
          <div className="relative z-10 flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h2 className="text-xl font-bold text-amber-200 mb-2">Attention Needed</h2>
              <p className="text-amber-100/90 font-medium mb-2">
                Medical attention recommended.
              </p>
              <p className="text-amber-100/70 text-sm">
                Based on your symptoms, it is advisable to consult a healthcare professional soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dr. AI Response Section */}
      {analysis.aiResponse && (
        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-primary/50 via-blue-500/50 to-primary/50">
          <div className="bg-section-darker rounded-2xl p-6 md:p-8 h-full">
            <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary ${analysis.aiResponse.includes('⚠️ AI Analysis Error') ? 'text-amber-500 bg-amber-500/20' : ''}`}>
                {analysis.aiResponse.includes('⚠️ AI Analysis Error') ? '⚠️' : '✦'}
              </span>
              AI Assessment {analysis.aiResponse.includes('⚠️ AI Analysis Error') && <span className="text-amber-500 text-sm font-normal">(Diagnostic Mode)</span>}
            </h2>
            <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white max-w-none">
              <p className={`whitespace-pre-wrap leading-relaxed ${analysis.aiResponse.includes('⚠️ AI Analysis Error') ? 'text-amber-200/90 font-medium' : ''}`}>
                {analysis.aiResponse}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Clinical Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Clinical Observations (Only if long, else skip to focus on summary) */}
        {analysis.clinicalObservations && analysis.clinicalObservations.length > 50 && (
          <div className="bg-section-darker border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary">01</span> Assessment Details
            </h3>
            <p className="text-text-muted leading-relaxed">{analysis.clinicalObservations}</p>
          </div>
        )}

        {/* 2. Risk Level */}
        <div className="bg-section-darker border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-primary">02</span> Risk Assessment
          </h3>
          <div className={`p-4 rounded-xl border ${riskColor} inline-flex items-center gap-3`}>
            <span className="text-2xl font-bold">{analysis.riskLevel}</span>
            <div className="h-4 w-[1px] bg-current opacity-30"></div>
            <span className="text-sm font-medium opacity-90">Estimated Level</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Medical Considerations (Optional) */}
        {analysis.medicalConsiderations && analysis.medicalConsiderations.length > 0 && (
          <div className="bg-section-darker border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary">03</span> Considerations
            </h3>
            <ul className="space-y-3">
              {analysis.medicalConsiderations.map((consideration, index) => (
                <li key={index} className="flex items-start gap-3 text-text-muted">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                  <span>{consideration}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Recommended Actions */}
        {analysis.recommendedActions && analysis.recommendedActions.length > 0 && (
          <div className="bg-section-darker border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary">04</span> Next Steps
            </h3>
            <ul className="space-y-3">
              {analysis.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded bg-green-500/20 text-green-400 text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-300 text-sm">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* NEW: Needed Items / Treatment & Care Plan */}
      {analysis.alternativeTreatments && analysis.alternativeTreatments.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-primary">05</span> Needed Items & Care
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.alternativeTreatments.map((treatment, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xl">🩺</span>
                <span className="text-sm text-gray-200">{treatment}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW: Specialist Recommendations */}
      {analysis.doctorRecommendations && analysis.doctorRecommendations.length > 0 && (
        <div className="bg-section-darker border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-primary">06</span> Specialist Consultations
          </h3>
          <div className="flex flex-wrap gap-3">
            {analysis.doctorRecommendations.map((doctor, index) => (
              <div key={index} className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium flex items-center gap-2">
                <span className="text-lg">👨‍⚕️</span>
                {doctor}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NEW: Medications */}
        {analysis.suggestedMedications && analysis.suggestedMedications.length > 0 && (
          <div className="bg-section-darker border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary">07</span> Tablets & OTC
            </h3>
            <ul className="space-y-3">
              {analysis.suggestedMedications.map((med, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <span className="text-xl">💊</span>
                  <span className="text-sm text-gray-200">{med}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* NEW: Required Supplies */}
        {analysis.requiredSupplies && analysis.requiredSupplies.length > 0 && (
          <div className="bg-section-darker border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary">08</span> Essential Supplies
            </h3>
            <ul className="space-y-3">
              {analysis.requiredSupplies.map((supply, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <span className="text-xl">🛠️</span>
                  <span className="text-sm text-gray-200">{supply}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* NEW: Supplements */}
      {analysis.supplements && analysis.supplements.length > 0 && (
        <div className="bg-section-darker border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-primary">09</span> Supplements & Vitamins
          </h3>
          <ul className="space-y-3">
            {analysis.supplements.map((supp, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
                <span className="text-xl">🌿</span>
                <span className="text-sm text-gray-200">{supp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Warning Signs */}
      {analysis.emergencyWarnings && analysis.emergencyWarnings.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
            Details to Discuss with Doctor
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.emergencyWarnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-400 text-sm">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0"></span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )
      }

      {/* AI Chat Interface */}
      <div className="bg-section-dark border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
            Chat with AI
          </h2>

        </div>

        {/* Chat Messages */}
        <div className="p-6 max-h-[500px] overflow-y-auto space-y-4 custom-scrollbar bg-section-darker">
          {consultation.messages && consultation.messages.length > 0 ? (
            <>
              {consultation.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-5 py-3 rounded-2xl ${message.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm shadow-glow'
                      : 'bg-white/10 text-gray-200 rounded-bl-sm border border-white/5'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className="text-[10px] mt-1 opacity-50 text-right">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <span className="text-primary text-xl">💬</span>
              </div>
              <p className="text-white font-medium mb-1">Start a conversation</p>
              <p className="text-sm text-text-muted">Ask specifically about your symptoms or these results.</p>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <form onSubmit={handleChatSubmit} className="flex gap-3">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type your follow-up question..."
              className="flex-1 px-4 py-3 rounded-xl bg-section-dark border border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !chatMessage.trim()}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-blue-600 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span>
              ) : "Send"}
            </button>
          </form>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="p-4 text-center">
        <p className="text-xs text-text-muted/40">
          AI-generated suggestions. Verify with clinical protocols.
        </p>
      </div>
    </div >
  );
}
