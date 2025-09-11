// components/CallModal.tsx
import React, { useEffect, useRef } from 'react';

interface CallModalProps {
    isOpen: boolean;
    isIncoming: boolean;
    callerName: string;
    callType: 'audio' | 'video';
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    onAccept: () => void;
    onReject: () => void;
    onEnd: () => void;
    callDuration?: number;
}

const CallModal: React.FC<CallModalProps> = ({
    isOpen,
    isIncoming,
    callerName,
    callType,
    localStream,
    remoteStream,
    onAccept,
    onReject,
    onEnd,
    callDuration = 0
}) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 max-w-full mx-4">
                {/* Incoming call */}
                {isIncoming && (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 mx-auto bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                Incoming {callType} Call
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">From: {callerName}</p>
                        </div>

                        <div className="flex space-x-4 justify-center">
                            <button
                                onClick={onReject}
                                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                                title="Decline"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <button
                                onClick={onAccept}
                                className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                                title="Accept"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}

                {/* Ongoing call */}
                {!isIncoming && (
                    <>
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                                Ongoing {callType} Call
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">With: {callerName}</p>
                            <p className="text-sm text-gray-500">{formatDuration(callDuration)}</p>
                        </div>

                        {/* Video streams */}
                        {callType === 'video' && (
                            <div className="relative mb-4 rounded-lg overflow-hidden bg-black">
                                {/* Remote video */}
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-48 object-cover"
                                    muted={false}
                                />

                                {/* Local video preview */}
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="absolute bottom-2 right-2 w-20 h-15 bg-gray-800 rounded border border-white"
                                />
                            </div>
                        )}

                        {/* Audio call interface */}
                        {callType === 'audio' && (
                            <div className="text-center mb-6">
                                <div className="w-24 h-24 mx-auto bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl mb-4">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-500">Connected...</p>
                            </div>
                        )}

                        <div className="flex justify-center">
                            <button
                                onClick={onEnd}
                                className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>End Call</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallModal;