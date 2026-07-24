import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function SOSButton() {
    const [isActivating, setIsActivating] = useState(false);
    const [isTriggered, setIsTriggered] = useState(false);
    const triggerSOS = useMutation(api.medical.triggerSOS);

    const handleSOS = () => {
        setIsActivating(true);

        if (!("geolocation" in navigator)) {
            toast.error("Geolocation is not supported by your browser");
            setIsActivating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await triggerSOS({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setIsTriggered(true);
                    toast.success("EMERGENCY ALERT SENT! Help is on the way.", {
                        duration: 10000,
                        position: "top-center",
                    });
                } catch (error) {
                    console.error("SOS Trigger failed:", error);
                    toast.error("Failed to send SOS alert. Please call emergency services directly.");
                } finally {
                    setIsActivating(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast.error("Could not get your location. Sending SOS without coordinates...");
                // Fallback: trigger with default/null coords if needed, or just fail
                setIsActivating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    if (isTriggered) {
        return (
            <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-bold animate-pulse shadow-glow-red">
                <span className="text-xl">🚨</span> SOS ACTIVE - HELP ARRIVING
            </div>
        );
    }

    return (
        <button
            onClick={handleSOS}
            disabled={isActivating}
            className={`
                relative group flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-500
                ${isActivating
                    ? "bg-red-800 cursor-wait"
                    : "bg-red-600 hover:bg-red-500 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.8)]"
                }
                text-white border border-red-400/30
            `}
        >
            <span className={`text-lg ${isActivating ? "animate-spin" : "group-hover:animate-bounce"}`}>
                {isActivating ? "⏳" : "🆘"}
            </span>
            <span>{isActivating ? "Dispatching..." : "SOS Emergency"}</span>

            {/* Visual Flare */}
            <span className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-ping opacity-20 pointer-events-none"></span>
        </button>
    );
}
