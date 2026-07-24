import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function ReportAnalyzer() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    // @ts-ignore
    const analyzeReport = useAction(api.medical.analyzeReport);
    const saveReport = useMutation(api.medical.saveReport);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setResult(null); // Reset previous result
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);
        try {
            const analysis = await analyzeReport({ image: selectedImage });
            setResult(analysis);
            toast.success("Report analyzed successfully");
        } catch (error: any) {
            console.error("Report Analysis failed:", error);
            const errorMsg = error.message || "";
            if (errorMsg.includes("API key")) {
                toast.error("OpenAI API Key is missing. Please check your Convex dashboard.", {
                    duration: 5000,
                });
            } else {
                toast.error("Failed to analyze report. Check your API connection.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!result || !selectedImage) return;

        try {
            await saveReport({
                title: `Report - ${new Date().toLocaleDateString()}`,
                type: "Medical Report",
                imageUrl: selectedImage,
                analysis: result
            });
            toast.success("Report saved to history");
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save report");
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-display font-bold text-white mb-2">Medical Report Analyzer</h2>
                <p className="text-text-muted">
                    Upload medical reports (lab results, imaging, etc.) for AI-powered summarization and insights.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-section-darker hover:border-primary/30 transition-colors relative h-[400px] flex flex-col items-center justify-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        {selectedImage ? (
                            <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10">
                                <img src={selectedImage} alt="Uploaded report" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-white font-medium">Click to Change Image</span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 pointer-events-none">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    📄
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Upload Report</h3>
                                <p className="text-sm text-text-muted">
                                    Drag and drop or click to upload
                                </p>
                                <p className="text-xs text-text-muted/60 mt-2">
                                    Supported formats: JPG, PNG
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedImage || isAnalyzing}
                        className="w-full px-6 py-4 bg-primary text-white rounded-xl hover:bg-blue-600 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg"
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing Report...
                            </span>
                        ) : "Analyze Report"}
                    </button>
                </div>

                {/* Results Section */}
                <div className="bg-section-dark border border-white/5 rounded-2xl p-6 min-h-[400px] shadow-2xl relative overflow-hidden">
                    {result ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 h-full overflow-y-auto custom-scrollbar pr-2">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-lg font-bold text-white">Analysis Results</h3>
                                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">
                                    Completed
                                </span>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <span>💾</span> Save Analysis
                                </button>
                            </div>

                            {/* Summary */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Summary</h4>
                                <p className="text-white leading-relaxed">{result.summary}</p>
                            </div>

                            {/* Abnormalities */}
                            {result.abnormalities && result.abnormalities.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        ⚠️ Abnormalities Detected
                                    </h4>
                                    <ul className="space-y-2">
                                        {result.abnormalities.map((abnnormality: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-red-200/80 text-sm">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0"></span>
                                                {abnnormality}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Findings Grid */}
                            <div className="grid gap-4">
                                {result.findings?.map((finding: any, idx: number) => (
                                    <div key={idx} className="bg-section-darker rounded-xl border border-white/5 overflow-hidden">
                                        <div className="bg-white/5 px-4 py-2 border-b border-white/5">
                                            <h5 className="font-bold text-white text-sm">{finding.category}</h5>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {finding.results.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center text-sm">
                                                    <span className="text-text-muted">{item.test}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-medium">{item.value}</span>
                                                        {item.status !== 'Normal' && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${['High', 'Low', 'Abnormal', 'Critical'].includes(item.status)
                                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                                }`}>
                                                                {item.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recommendations */}
                            {result.recommendations && result.recommendations.length > 0 && (
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">
                                        Recommended Next Steps
                                    </h4>
                                    <ul className="space-y-2">
                                        {result.recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-blue-100/70 text-sm">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <div className="text-xs text-text-muted/40 text-center pt-4 border-t border-white/5">
                                {result.disclaimer}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted/50 p-8 text-center relative z-10">
                            <div className="text-4xl mb-4 opacity-50">📊</div>
                            <p>Upload a report and click Analyze</p>
                            <p className="text-sm mt-2 max-w-xs opacity-70">
                                The AI will extract key findings, flag abnormalities, and summarize the report.
                            </p>
                        </div>
                    )}

                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                </div>
            </div>
        </div >
    );
}
