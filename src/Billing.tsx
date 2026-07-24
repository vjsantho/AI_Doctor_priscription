import { useState } from "react";
import { toast } from "sonner";

interface BillingProps {
    medicines: any[];
    onBack?: () => void;
    onReset?: () => void;
}

export function Billing({ medicines, onBack, onReset }: BillingProps) {
    const [step, setStep] = useState<"summary" | "address" | "payment" | "success">("summary");
    const [address, setAddress] = useState({
        name: "",
        street: "",
        city: "",
        zip: "",
        phone: ""
    });

    // Generate mock prices (e.g., $10-$50)
    const orderItems = medicines.map((med, index) => ({
        ...med,
        price: 10 + (index * 5) + Math.floor(Math.random() * 20),
        quantity: 1
    }));

    const total = orderItems.reduce((acc, item) => acc + item.price, 0);

    const handleNext = () => {
        if (step === "summary") setStep("address");
        else if (step === "address") {
            if (!address.name || !address.street || !address.city || !address.zip || !address.phone) {
                toast.error("Please fill in all address fields");
                return;
            }
            setStep("payment");
        } else if (step === "payment") {
            setStep("success");
            toast.success("Order placed successfully!");
        }
    };

    if (step === "success") {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500 text-center">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-5xl mb-6 border border-green-500/50 animate-bounce">
                    ✅
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Order Confirmed!</h2>
                <p className="text-text-muted max-w-sm mb-8">
                    Your medicines have been ordered and will be delivered to your address within 24-48 hours.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onReset}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-glow transition-all"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
                    >
                        Download Invoice
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Secure Checkout</h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-1 rounded ${step === 'summary' ? 'bg-primary text-white' : 'bg-white/5 text-text-muted'}`}>1. Summary</span>
                        <span className="text-white/20">→</span>
                        <span className={`px-2 py-1 rounded ${step === 'address' ? 'bg-primary text-white' : 'bg-white/5 text-text-muted'}`}>2. Address</span>
                        <span className="text-white/20">→</span>
                        <span className={`px-2 py-1 rounded ${step === 'payment' ? 'bg-primary text-white' : 'bg-white/5 text-text-muted'}`}>3. Payment</span>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="text-text-muted hover:text-white flex items-center gap-1 text-sm font-medium transition-colors"
                >
                    ✕ Cancel
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    {step === "summary" && (
                        <div className="bg-section-darker rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="font-bold text-white text-lg">Medicine Summary</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {orderItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl border border-primary/20">
                                                💊
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">{item.name}</h4>
                                                <p className="text-xs text-text-muted">{item.dosage || 'Dosage not specified'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-white">${item.price.toFixed(2)}</div>
                                            <div className="text-xs text-text-muted">Qty: 1</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "address" && (
                        <div className="bg-section-darker rounded-2xl border border-white/5 p-6 animate-in fade-in duration-300">
                            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                                <span>📍</span> Delivery Address
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={address.name}
                                        onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Street Address</label>
                                    <input
                                        type="text"
                                        value={address.street}
                                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                        placeholder="123 Medical Way"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">City</label>
                                    <input
                                        type="text"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        placeholder="Care Town"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">ZIP Code</label>
                                    <input
                                        type="text"
                                        value={address.zip}
                                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                                        placeholder="54321"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={address.phone}
                                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "payment" && (
                        <div className="bg-section-darker rounded-2xl border border-white/5 p-6 animate-in fade-in duration-300">
                            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                                <span>💳</span> Payment Information
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-primary/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">🏦</div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Credit / Debit Card</p>
                                            <p className="text-xs text-text-muted">Secure transaction via Doctor AI Pay</p>
                                        </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-4 border-primary bg-primary shadow-glow"></div>
                                </div>

                                <div className="space-y-4 mt-6">
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Card Number</label>
                                        <input
                                            type="text"
                                            placeholder="4444 4444 4444 4444"
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM / YY"
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">CVV</label>
                                            <input
                                                type="password"
                                                placeholder="•••"
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Order Total */}
                <div className="lg:col-span-1">
                    <div className="bg-section-darker rounded-2xl border border-white/5 p-6 sticky top-24">
                        <h3 className="font-bold text-white mb-6">Order Summary</h3>
                        <div className="space-y-3 text-sm mb-6">
                            <div className="flex justify-between text-text-muted">
                                <span>Subtotal</span>
                                <span className="text-white">${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-text-muted">
                                <span>Delivery Fee</span>
                                <span className="text-green-400">FREE</span>
                            </div>
                            <div className="flex justify-between text-text-muted">
                                <span>Tax (GST/VAT)</span>
                                <span className="text-white">${(total * 0.05).toFixed(2)}</span>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between text-lg font-bold">
                                <span className="text-white">Total</span>
                                <span className="text-primary">${(total * 1.05).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${step === 'payment'
                                ? 'bg-green-600 hover:bg-green-700 hover:shadow-glow-green text-white'
                                : 'bg-primary hover:bg-blue-600 hover:shadow-glow text-white'
                                }`}
                        >
                            {step === "summary" && "Confirm Order Summary"}
                            {step === "address" && "Save Address & Continue"}
                            {step === "payment" && "Place Order Now"}
                            <span className="text-lg">→</span>
                        </button>

                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                                <span className="text-green-500">🛡️</span> Secure Checkout
                            </div>
                            <p className="text-[10px] text-text-muted/40 uppercase tracking-widest leading-relaxed">
                                Doctor AI uses advanced encryption to protect your medical and financial information.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
