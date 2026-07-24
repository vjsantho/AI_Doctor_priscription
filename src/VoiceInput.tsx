import { useEffect } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition.ts'; // Corrected import path
import { toast } from 'sonner';

interface VoiceInputProps {
    onResult: (text: string) => void;
    className?: string;
}

export function VoiceInput({ onResult, className }: VoiceInputProps) {
    // @ts-ignore
    const { isListening, transcript, startListening, stopListening, error, hasSupport } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            onResult(transcript);
        }
    }, [transcript, onResult]);

    useEffect(() => {
        if (error) {
            toast.error(`Voice input error: ${error}`);
        }
    }, [error]);

    const handleToggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
            toast.info("Listening...");
        }
    };

    if (!hasSupport) {
        return null; // Don't render if browser doesn't support
    }

    return (
        <button
            type="button"
            onClick={handleToggleListening}
            className={`p-2 rounded-full transition-all duration-300 relative ${isListening
                ? "bg-red-500 text-white animate-pulse-ring shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-red-400"
                : "bg-section-darker text-text-muted hover:bg-primary/20 hover:text-primary border border-white/5"
                } ${className}`}
            title={isListening ? "Stop listening" : "Start voice input"}
        >
            {isListening ? (
                <span className="text-lg">⏹️</span>
            ) : (
                <span className="text-lg">🎙️</span>
            )}
        </button>
    );
}
