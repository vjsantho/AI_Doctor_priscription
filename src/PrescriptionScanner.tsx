import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface PrescriptionScannerProps {
    onOrder?: (medicines: any[]) => void;
}

export function PrescriptionScanner({ onOrder }: PrescriptionScannerProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const analyzePrescription = useAction(api.medical.analyzePrescription);

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
            const analysis = await analyzePrescription({ image: selectedImage });
            setResult(analysis);
            toast.success("Prescription analyzed successfully");
        } catch (error: any) {
            console.error("Prescription Analysis failed:", error);
            const errorMsg = error.message || "";
            if (errorMsg.includes("API key")) {
                toast.error("OpenAI API Key is missing. Please check your Convex dashboard.", {
                    duration: 5000,
                });
            } else {
                toast.error("Failed to analyze prescription. Check your API connection.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleOrder = () => {
        if (result?.medicines && onOrder) {
            onOrder(result.medicines);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-display font-bold text-white mb-2">Prescription Scanner</h2>
                <p className="text-text-muted">
                    Upload a clear image of a prescription to identify medicines and decipher handwriting.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-section-darker hover:border-primary/30 transition-colors relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {selectedImage ? (
                            <div className="relative rounded-xl overflow-hidden border border-white/10">
                                <img src={selectedImage} alt="Uploaded prescription" className="w-full h-auto" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-medium">Click to Change Image</span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    📸
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Upload Prescription</h3>
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
                                Analyzing Handwriting...
                            </span>
                        ) : "Analyze Prescription"}
                    </button>
                </div>

                {/* Results Section */}
                <div className="bg-section-dark border border-white/5 rounded-2xl p-6 min-h-[400px] shadow-2xl">
                    {result ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-lg font-bold text-white">Analysis Results</h3>
                                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">
                                    Completed
                                </span>
                            </div>

                            {/* Transcription */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Handwriting Transcription</h4>
                                <p className="text-white italic">"{result.transcription}"</p>
                            </div>

                            {/* Medicines List */}
                            <div>
                                <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Identified Medicines</h4>
                                <div className="space-y-3">
                                    {result.medicines?.map((med: any, idx: number) => (
                                        <div key={idx} className="bg-section-darker p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="font-bold text-primary text-lg">{med.name}</h5>
                                                    {med.dosage && <p className="text-sm text-white/80">{med.dosage}</p>}
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded border ${med.confidence === 'High'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : med.confidence === 'Medium'
                                                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                    {med.confidence} Confidence
                                                </span>
                                            </div>
                                            {med.instructions && (
                                                <p className="text-xs text-text-muted mt-1 bg-white/5 p-2 rounded">
                                                    📝 {med.instructions}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Action */}
                            <div className="pt-4">
                                <button
                                    onClick={handleOrder}
                                    className="w-full px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:shadow-glow-green transition-all duration-300 font-bold text-lg flex items-center justify-center gap-2"
                                >
                                    <span>📦</span> Proceed to Order Medicines
                                </button>
                            </div>

                            {/* Notes */}
                            {result.notes && (
                                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4">
                                    <h4 className="text-xs font-bold text-yellow-500/80 mb-1">Notes on Legibility</h4>
                                    <p className="text-sm text-yellow-200/60">{result.notes}</p>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <div className="text-xs text-text-muted/40 text-center pt-4 border-t border-white/5">
                                {result.disclaimer}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted/50 p-8 text-center">
                            <div className="text-4xl mb-4 opacity-50">🔍</div>
                            <p>Upload a prescription and click Analyze</p>
                            <p className="text-sm mt-2 max-w-xs opacity-70">
                                The AI will attempt to decode the handwriting and identify medicine names.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

