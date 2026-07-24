import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { MedicalConsultation } from "./MedicalConsultation";
import { ConsultationHistory } from "./ConsultationHistory";
import { PrescriptionScanner } from "./PrescriptionScanner";
import { ReportAnalyzer } from "./ReportAnalyzer";
import { Billing } from "./Billing";
import { SOSButton } from "./SOSButton";
import { NotificationBell } from "./NotificationBell";
import { useState } from "react";

export default function App() {
  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Soft Glow Overlays & Branding Text */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none flex flex-col items-center justify-center select-none">
        {/* Large Watermark Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.05]">
          <h1 className="text-[20vw] font-black uppercase tracking-tighter leading-none select-none text-white">
            Doctor AI
          </h1>
          <p className="text-[4vw] font-bold uppercase tracking-widest -mt-4 select-none text-blue-400">
            Empowerd by the Real Doctor DB
          </p>
        </div>

        {/* Animated Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 group-hover:shadow-glow transition-all duration-300">
              <span className="text-primary text-lg">✦</span>
            </div>
            <h2 className="text-xl font-display font-bold tracking-tight text-white group-hover:text-primary transition-colors">
              Doctor AI <span className="text-slate-400 font-normal text-sm ml-2 hidden sm:inline-block">| AMRC Ecosystem</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <SOSButton />
            <NotificationBell />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <Content />
      </main>
      <Toaster
        theme="dark"
        toastOptions={{
          style: { background: '#161616', border: '1px solid #333', color: '#fff' }
        }}
      />
    </div >
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [activeTab, setActiveTab] = useState<"consultation" | "history" | "scanner" | "report" | "checkout">("consultation");
  const [orderData, setOrderData] = useState<any[]>([]);

  const handleOrderInitiated = (medicines: any[]) => {
    setOrderData(medicines);
    setActiveTab("checkout");
  };

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Unauthenticated>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Column: Content */}
          <div className="text-left space-y-8">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-medium text-primary tracking-wide uppercase">AMRC Clinical System</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 tracking-tight leading-tight text-white">
                Smarter Care Through <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                  Doctor AI
                </span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                Next-generation clinical AI ecosystem for collaborative patient care, diagnostic precision, and automated workflow management.
              </p>

              <div className="mt-8 space-y-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="text-amber-500">⚠️</span> Important Disclaimer
                </h3>
                <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside marker:text-primary">
                  <li>AI is a support tool and does not replace human doctors.</li>
                  <li>AI capabilities do not exceed professional clinical judgment.</li>
                  <li>All AI suggestions must be verified by a qualified physician.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-text-muted/60">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span> HIPAA Compliant
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span> Real-time Analysis
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span> 24/7 Availability
              </div>
            </div>

            <div className="glass-panel p-6 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-600/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative">
                <SignInForm />
              </div>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="relative hidden lg:block h-[600px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
              alt="Medical Professional"
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />

            {/* Overlay Cards */}
            <div className="absolute bottom-8 left-8 right-8 z-20 grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">99.8%</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Uptime Reliability</div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-primary mb-1">AMRC</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Center of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </Unauthenticated >

      <Authenticated>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar / Quick Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-section-darker border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')] bg-cover bg-center opacity-10"></div>
                <h3 className="text-lg font-bold text-white mb-2 relative z-10">AMRC Dashboard</h3>
                <p className="text-sm text-text-muted relative z-10">
                  Welcome to the Advanced Medical Research Centre clinical portal.
                </p>
              </div>

              <div className="glass-panel p-1 rounded-xl shadow-lg flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab("consultation")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-3 ${activeTab === "consultation"
                    ? "bg-primary text-white shadow-glow"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                >
                  <span>🏥</span> New Consultation
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-3 ${activeTab === "history"
                    ? "bg-primary text-white shadow-glow"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                >
                  <span>📂</span> Patient History
                </button>
                <button
                  onClick={() => setActiveTab("scanner")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-3 ${activeTab === "scanner"
                    ? "bg-primary text-white shadow-glow"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                >
                  <span>🔍</span> Rx Scanner
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-3 ${activeTab === "report"
                    ? "bg-primary text-white shadow-glow"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                >
                  <span>📊</span> Report Upload
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="glass-panel rounded-3xl p-1 overflow-hidden relative min-h-[600px]">
                {/* Background Texture Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 pointer-events-none"></div>

                <div className="relative z-10 p-6 md:p-8">
                  {activeTab === "consultation" && <MedicalConsultation />}
                  {activeTab === "history" && <ConsultationHistory />}
                  {activeTab === "scanner" && <PrescriptionScanner onOrder={handleOrderInitiated} />}
                  {activeTab === "report" && <ReportAnalyzer />}
                  {activeTab === "checkout" && (
                    <Billing
                      medicines={orderData}
                      onBack={() => setActiveTab("scanner")}
                      onReset={() => setActiveTab("consultation")}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Authenticated>
    </div >
  );
}
