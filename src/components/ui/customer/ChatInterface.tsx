"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { Message, useChat } from '@/contexts/ChatContext';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '@/lib/config';
import { CiMicrophoneOn, CiMicrophoneOff } from "react-icons/ci";
import { useTranslations } from '@/utils/useTranslations';

interface Attachment {
    file: File;
    preview: string | null;
    type: 'image' | 'file' | 'video' | 'voice';
}

interface ChatInterfaceProps {
    params: Promise<{ locale: "en" | "kh" }>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ params }) => {
    const [message, setMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [showMessageMenu, setShowMessageMenu] = useState<number | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [callDuration, setCallDuration] = useState(0);
    const callDurationRef = useRef<NodeJS.Timeout | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [callStartTime, setCallStartTime] = useState<number | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const {
        conversations,
        activeConversation,
        messages,
        deliveryAgents,
        customers,
        isLoading,
        isUploading,
        onlineUsers,
        userPresence,
        setActiveConversation,
        sendMessage,
        sendMessageWithAttachment,
        emitTypingEvent,
        findOrCreateConversation,
        markAsRead,
        fetchConversations,
        typingUsers,
        editMessage,
        deleteMessage,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        activeCall,
        isInCall,
        sendVoiceMessage
    } = useChat();

    const [user, setUser] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);

    // Unwrap the params promise
    const { locale } = React.use(params);
    const language = locale || "en";
    const t = useTranslations(language);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            setUser(storedUser ? JSON.parse(storedUser) : null);
        }
    }, []);

    // Fetch conversations on component mount
    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    // this effect to track call duration
    useEffect(() => {
        if (isInCall && activeCall) {
            const startTime = callStartTime || Date.now();
            setCallStartTime(startTime);

            callDurationRef.current = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else {
            if (callDurationRef.current) {
                clearInterval(callDurationRef.current);
            }
            setCallDuration(0);
            setCallStartTime(null);
        }

        return () => {
            if (callDurationRef.current) {
                clearInterval(callDurationRef.current);
            }
        };
    }, [isInCall, activeCall]);

    // Format duration function
    const formatCallDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start/stop voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendVoiceMessage(audioBlob, recordingTime);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Reset recording state
                setIsRecording(false);
                setRecordingTime(0);
                if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Start timer
            let time = 0;
            recordingIntervalRef.current = setInterval(() => {
                time += 1;
                setRecordingTime(time);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            Swal.fire({
                icon: 'error',
                title: t.chatPage.microphoneAccessRequired,
                text: t.chatPage.allowMicrophoneAccess,
                timer: 3000,
                showConfirmButton: false
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    // Handle call functions
    const handleInitiateCall = async (type: 'audio' | 'video') => {
        try {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            });

            setLocalStream(stream);

            // Mute by default (optional)
            stream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });

            // Continue with your existing call initiation code
            await initiateCall(type);
            setCallStartTime(Date.now());
        } catch (error) {
            console.error('Failed to get user media:', error);
            Swal.fire({
                icon: 'error',
                title: t.chatPage.cameraMicrophoneAccessRequired,
                text: t.chatPage.allowCameraMicrophoneAccess,
                timer: 3000,
                showConfirmButton: false
            });
        }
    };

    // Toggle mute function
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    const handleEndCall = async () => {
        if (!activeCall) return;

        try {
            // Stop all media tracks to release microphone/camera
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                setLocalStream(null);
            }

            // Calculate actual duration
            const actualDuration = callStartTime
                ? Math.floor((Date.now() - callStartTime) / 1000)
                : 0;

            await endCall(activeCall.call_id, actualDuration);
        } catch (error) {
            console.error('Failed to end call:', error);
        }
    };

    // Format recording time
    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (activeConversation) {
            markAsRead(activeConversation.id);
        }
    }, [activeConversation, markAsRead]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const parseTimestamp = (isoString: string) => {
        if (!isoString) return '';
        const clean = isoString.replace(/\.\d+Z$/, 'Z');
        const date = new Date(clean);
        return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleStartChat = async (vendorId: number) => {
        try {
            await findOrCreateConversation(vendorId);
            fetchConversations();
            setIsMobileSidebarOpen(false);
        } catch (error) {
            console.error('Failed to start chat:', error);
            Swal.fire({
                icon: 'error',
                title: t.chatPage.failedToStartChat,
                text: t.chatPage.pleaseTryAgain,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!message.trim() && !attachment) || !activeConversation) return;

        try {
            if (attachment) {
                const formData = new FormData();

                // Add message text if available
                if (message.trim()) {
                    formData.append('body', message);
                }

                // Add the file
                formData.append('attachment', attachment.file);

                // Add type based on file type
                if (attachment.type === 'image') {
                    formData.append('type', 'image');
                } else if (attachment.type === 'video') {
                    formData.append('type', 'video');
                } else {
                    formData.append('type', 'file');
                }

                await sendMessageWithAttachment(formData);
            } else {
                await sendMessage(message);
            }

            setMessage('');
            setAttachment(null);

            // Stop typing indicator immediately after sending
            if (activeConversation) {
                emitTypingEvent(activeConversation.id, false);
            }
            setIsTyping(false);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);

        if (!activeConversation) return;

        // Handle typing events with better timing
        const wasTyping = isTyping;
        const nowTyping = e.target.value.length > 0;

        // Update typing state
        setIsTyping(nowTyping);

        // Clear any existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        // Send typing events with better timing
        if (nowTyping && !wasTyping) {
            // Just started typing - send immediately
            emitTypingEvent(activeConversation.id, true);
        } else if (!nowTyping && wasTyping) {
            // Stopped typing - send immediately
            emitTypingEvent(activeConversation.id, false);
        } else if (nowTyping) {
            // Still typing - set a timeout to stop if no activity
            typingTimeoutRef.current = setTimeout(() => {
                emitTypingEvent(activeConversation.id, false);
                setIsTyping(false);
            }, 1000);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (file.size > maxSize) {
            Swal.fire({
                icon: 'error',
                title: t.chatPage.fileTooLarge,
                text: t.chatPage.selectFileSmaller,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
            return;
        }

        // Determine file type more accurately
        let fileType: 'image' | 'video' | 'file' = 'file';

        if (file.type.startsWith('image/')) {
            fileType = 'image';
            const reader = new FileReader();
            reader.onload = (e) => {
                setAttachment({
                    file,
                    preview: e.target?.result as string,
                    type: fileType
                });
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            fileType = 'video';
            setAttachment({
                file,
                preview: null,
                type: fileType
            });
        } else {
            setAttachment({
                file,
                preview: null,
                type: fileType
            });
        }
    };

    const handleEditMessage = async (messageId: number, newBody: string) => {
        try {
            await editMessage(messageId, newBody);
            setEditingMessage(null);
            Swal.fire({
                icon: 'success',
                title: t.chatPage.messageUpdated,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            console.error('Failed to edit message:', error);
            Swal.fire({
                icon: 'error',
                title: t.chatPage.failedToEditMessage,
                text: error instanceof Error ? error.message : t.chatPage.pleaseTryAgain,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }
    };

    const handleDeleteMessage = async (messageId: number) => {
        // Confirm deletion
        const result = await Swal.fire({
            title: t.chatPage.areYouSure,
            text: t.chatPage.cannotRevert,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t.chatPage.yesDeleteIt
        });

        if (result.isConfirmed) {
            try {
                await deleteMessage(messageId);
                setShowMessageMenu(null);
                Swal.fire({
                    icon: 'success',
                    title: t.chatPage.messageDeleted,
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } catch (error) {
                console.error('Failed to delete message:', error);
                Swal.fire({
                    icon: 'error',
                    title: t.chatPage.failedToDeleteMessage,
                    text: error instanceof Error ? error.message : t.chatPage.pleaseTryAgain,
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            }
        }
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getOtherParticipant = (conversation: any) => {
        if (!user || !conversation.participants) return null;
        return conversation.participants.find((p: any) => p.id !== user.id) || null;
    };

    // Filter conversations to show only vendor and delivery conversations
    const vendorAndDeliveryConversations = conversations.filter(conv => {
        const otherParticipant = getOtherParticipant(conv);
        if (!otherParticipant) return false;

        console.log('Participant role_id:', otherParticipant.role_id, 'Name:', otherParticipant.name);

        // Check if the participant is a vendor (4) or delivery agent (5)
        const isVendor = otherParticipant.role_id === 4;
        const isDeliveryAgent = otherParticipant.role_id === 5;

        return isVendor || isDeliveryAgent;
    });

    // Filter conversations based on search
    const filteredConversations = vendorAndDeliveryConversations.filter(conversation => {
        const otherParticipant = getOtherParticipant(conversation);
        if (!otherParticipant) return false;

        const nameMatch = otherParticipant.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const messageMatch = conversation.latest_message?.body?.toLowerCase().includes(searchTerm.toLowerCase());

        return nameMatch || messageMatch;
    });

    // Show notification for new messages when not in active conversation
    useEffect(() => {
        conversations.forEach(conv => {
            if (conv.unread_count && conv.unread_count > 0 &&
                (!activeConversation || activeConversation.id !== conv.id)) {

                const otherParticipant = getOtherParticipant(conv);
                if (otherParticipant) {
                    Swal.fire({
                        title: t.chatPage.newMessageFrom.replace('{name}', otherParticipant.name),
                        text: conv.latest_message?.body || '',
                        icon: 'info',
                        timer: 3000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                }
            }
        });
    }, [conversations]);

    // Clean up typing timeout when component unmounts
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Send stop typing when leaving the conversation
            if (activeConversation && isTyping) {
                emitTypingEvent(activeConversation.id, false);
            }
        };
    }, [activeConversation, isTyping, emitTypingEvent]);

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300">
            {/* Mobile sidebar toggle */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Sidebar */}
            <div className={`w-full md:w-96 flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col fixed md:relative inset-y-0 left-0 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300 ease-in-out shadow-xl z-40`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {t.chatPage.messages}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {t.chatPage.chatWithVendorsDelivery}
                            </p>
                        </div>
                        <button
                            className="md:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setIsMobileSidebarOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t.chatPage.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pl-12 bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Recent Conversations */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 px-2 uppercase tracking-wide">
                            {t.chatPage.recentConversations} <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full text-xs ml-1">{filteredConversations.length}</span>
                        </h3>
                        <div className="space-y-3">
                            {filteredConversations.map(conversation => {
                                const otherParticipant = getOtherParticipant(conversation);
                                if (!otherParticipant) return null;

                                return (
                                    <div
                                        key={conversation.id}
                                        className={`group flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 ${activeConversation?.id === conversation.id
                                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/50 shadow-md'
                                            : 'hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-md border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50'
                                            }`}
                                        onClick={() => {
                                            setActiveConversation(conversation);
                                            setIsMobileSidebarOpen(false);
                                        }}
                                    >
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                                                {otherParticipant.avatar ? (
                                                    <img
                                                        src={otherParticipant.avatar}
                                                        alt={otherParticipant.name}
                                                        className="w-14 h-14 rounded-2xl object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-lg">{otherParticipant.name?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${onlineUsers.has(otherParticipant?.id ?? 0)
                                                ? 'bg-green-500'
                                                : 'bg-gray-400'
                                                }`}></div>
                                        </div>
                                        <div className="ml-4 flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-semibold text-gray-800 dark:text-white truncate">{otherParticipant.name}</p>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                                    {conversation.latest_message && parseTimestamp(conversation.latest_message.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate mb-2">
                                                {conversation.latest_message?.body || t.chatPage.noMessagesYet}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${otherParticipant.role_id === 4
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                    }`}>
                                                    {otherParticipant.role_id === 4 ? t.chatPage.vendor : t.chatPage.deliverySupport}
                                                </span>
                                                {conversation.unread_count && conversation.unread_count > 0 && (
                                                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center shadow-sm">
                                                        {conversation.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredConversations.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t.chatPage.noConversationsYet}</p>
                                    <p className="text-gray-400 dark:text-gray-500 text-xs">
                                        {t.chatPage.startChatFromProduct}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-center p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-700/50">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium shadow-lg">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ml-3">
                            <p className="font-semibold text-gray-800 dark:text-white">{user?.name || t.chatPage.user}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.chatPage.customer}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                ></div>
            )}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col w-full min-w-0">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center">
                                <button
                                    className="md:hidden mr-4 p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {(() => {
                                    const otherParticipant = getOtherParticipant(activeConversation);
                                    return (
                                        <>
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium shadow-lg">
                                                    {otherParticipant?.avatar ? (
                                                        <img
                                                            src={otherParticipant.avatar}
                                                            alt={otherParticipant.name}
                                                            className="w-12 h-12 rounded-2xl object-cover"
                                                        />
                                                    ) : (
                                                        <span>{otherParticipant?.name?.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${onlineUsers.has(otherParticipant?.id ?? 0)
                                                    ? 'bg-green-500'
                                                    : 'bg-gray-400'
                                                    }`}></div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="font-semibold text-gray-800 dark:text-white">{otherParticipant?.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {otherParticipant?.id && onlineUsers.has(otherParticipant.id) ? (
                                                        <>
                                                            <span className="flex items-center">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                                                {t.chatPage.online}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        otherParticipant?.id && userPresence[otherParticipant.id]?.last_seen ?
                                                            `${t.chatPage.lastSeen} ${new Date(userPresence[otherParticipant.id].last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                                                            t.chatPage.offline
                                                    )}
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            {/* Call Buttons */}
                            {(() => {
                                const otherParticipant = getOtherParticipant(activeConversation);
                                if (otherParticipant?.role_id === 4 || otherParticipant?.role_id === 5) { // Show for vendors and delivery
                                    return (
                                        <div className="flex space-x-3">
                                            {isInCall ? (
                                                <button
                                                    onClick={handleEndCall}
                                                    className="p-3 bg-gradient-to-r from-red-500 to-red-600 cursor-pointer text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-md"
                                                    title={t.chatPage.endCall}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M2 3a1 1 0 011-1h3a1 1 0 011 1v1h8V3a1 1 0 011-1h3a1 1 0 011 1v1a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2V3zm3 2v1h10V5H5zm10 5a1 1 0 01-1 1H6a1 1 0 110-2h8a1 1 0 011 1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleInitiateCall('audio')}
                                                        className="p-3 bg-gradient-to-r from-green-500 to-green-600 cursor-pointer text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-md"
                                                        title={t.chatPage.voiceCall}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleInitiateCall('video')}
                                                        className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 cursor-pointer text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-md"
                                                        title={t.chatPage.videoCall}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50/50 to-blue-50/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-sm">
                            <div className="max-w-4xl mx-auto space-y-4">
                                {messages.map((msg, index) => (
                                    <div
                                        key={`${msg.id}-${index}`}
                                        className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                        onMouseEnter={() => msg.user_id === user?.id && setShowMessageMenu(msg.id)}
                                        onMouseLeave={() => setShowMessageMenu(null)}
                                    >
                                        <div className="relative group max-w-[80%] lg:max-w-[70%]">
                                            {/* Message menu (only shown for user's own messages) */}
                                            {msg.user_id === user?.id && showMessageMenu === msg.id && (
                                                <div className="absolute -top-10 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-2 flex space-x-2 z-10 border border-gray-200/50 dark:border-gray-600/50">
                                                    <button
                                                        onClick={() => setEditingMessage(msg)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title={t.chatPage.editMessage}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title={t.chatPage.deleteMessage}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Message content */}
                                            {editingMessage?.id === msg.id ? (
                                                // Edit mode
                                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 rounded-2xl rounded-br-md shadow-lg">
                                                    <input
                                                        type="text"
                                                        value={editingMessage.body}
                                                        onChange={(e) => setEditingMessage({ ...editingMessage, body: e.target.value })}
                                                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-blue-200"
                                                        placeholder={t.chatPage.typeMessage}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleEditMessage(msg.id, editingMessage.body);
                                                            } else if (e.key === 'Escape') {
                                                                setEditingMessage(null);
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex justify-end mt-2 space-x-2">
                                                        <button
                                                            onClick={() => handleEditMessage(msg.id, editingMessage.body)}
                                                            className="text-xs bg-white/20 text-white px-3 py-1 rounded-lg hover:bg-white/30 transition-colors"
                                                        >
                                                            {t.chatPage.save}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMessage(null)}
                                                            className="text-xs bg-white/10 text-white px-3 py-1 rounded-lg hover:bg-white/20 transition-colors"
                                                        >
                                                            {t.chatPage.cancel}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Normal message display
                                                <div
                                                    className={`px-4 py-3 rounded-2xl shadow-sm backdrop-blur-sm ${msg.user_id === user?.id
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                                                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white rounded-bl-md border border-gray-200/50 dark:border-gray-600/50'
                                                        }`}
                                                >

                                                    {/* Render different message types */}
                                                    {msg.type === 'call' ? (
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`p-2 rounded-xl ${msg.call_status === 'ended' ? 'bg-green-100/80 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-red-100/80 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-5 w-5"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    {msg.call_type === 'video' ? (
                                                                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                                                    ) : (
                                                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                                    )}
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">
                                                                    {msg.call_status === 'ended' ? t.chatPage.callEnded : t.chatPage.callMissed}
                                                                </p>
                                                                <p className="text-xs opacity-90">
                                                                    {msg.call_type === 'video' ? t.chatPage.videoCall : t.chatPage.voiceCall} •
                                                                    {msg.duration && msg.duration > 0
                                                                        ? ` ${formatCallDuration(msg.duration)}`
                                                                        : ` ${t.chatPage.callEnded}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : msg.type === 'voice' ? (
                                                        <div className="flex items-center space-x-4 p-3 rounded-xl bg-blue-100/50 dark:bg-blue-900/30 text-gray-800 dark:text-gray-100 shadow-sm">
                                                            {/* Play button */}
                                                            <button
                                                                onClick={() => {
                                                                    const audioEl = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                                                                    if (audioEl) {
                                                                        if (audioEl.paused) audioEl.play();
                                                                        else audioEl.pause();
                                                                    }
                                                                }}
                                                                className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 hover:scale-105 shadow-md"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-5 w-5"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path d="M6 4l12 6-12 6V4z" />
                                                                </svg>
                                                            </button>

                                                            {/* Waveform / duration */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-3">
                                                                    {/* Fake waveform bars */}
                                                                    <div className="flex space-x-1">
                                                                        {[...Array(15)].map((_, i) => (
                                                                            <div
                                                                                key={i}
                                                                                className="w-1 bg-blue-500 dark:bg-blue-300 rounded-full transition-all duration-300 hover:scale-y-125"
                                                                                style={{ height: `${Math.random() * 16 + 4}px` }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-sm font-medium opacity-75">{msg.duration ? formatRecordingTime(msg.duration) : '0:00'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Hidden real audio element */}
                                                            <audio
                                                                id={`audio-${msg.id}`}
                                                                src={msg.attachments?.[0]?.url}
                                                                className="hidden"
                                                                onError={() => console.error('Failed to load audio:', msg.attachments?.[0]?.url)}
                                                            />
                                                        </div>
                                                    ) : msg.attachments && msg.attachments.length > 0 ? (
                                                        msg.attachments.map((att, idx) => (
                                                            <div key={idx} className="mb-2">
                                                                {att.type === 'image' ? (
                                                                    <img
                                                                        src={att.url}
                                                                        alt={t.chatPage.sharedImage}
                                                                        className="rounded-xl max-w-full h-auto max-h-80 object-cover shadow-sm hover:shadow-md transition-shadow duration-300"
                                                                        onError={(e) => {
                                                                            console.error('Failed to load image:', att.url);
                                                                            e.currentTarget.src = 'https://via.placeholder.com/150';
                                                                        }}
                                                                    />
                                                                ) : att.type === 'video' ? (
                                                                    <video
                                                                        controls
                                                                        className="rounded-xl max-w-full h-auto max-h-80 object-cover shadow-sm hover:shadow-md transition-shadow duration-300"
                                                                        onError={(e) => {
                                                                            console.error('Failed to load video:', att.url);
                                                                        }}
                                                                    >
                                                                        <source src={att.url} type="video/mp4" />
                                                                        {t.chatPage.browserNoSupport}
                                                                    </video>
                                                                ) : null}
                                                                {msg.body && <p className="mt-2">{msg.body}</p>}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="leading-relaxed">{msg.body}</p>
                                                    )}

                                                    <div className={`flex justify-end mt-2 ${msg.user_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                                        <span className="text-xs opacity-80">
                                                            {parseTimestamp(msg.created_at)}
                                                            {msg.user_id === user?.id && (
                                                                <span className="ml-2">{msg.read_at ? t.chatPage.seen : t.chatPage.delivered}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator - Only show for other users */}
                                {typingUsers[activeConversation.id]
                                    ?.filter(u => u !== user?.name).length > 0 && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-200/50 dark:border-gray-600/50">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {typingUsers[activeConversation.id].filter(u => u !== user?.name).join(', ')}
                                                    {" "}
                                                    {typingUsers[activeConversation.id].filter(u => u !== user?.name).length === 1 ? t.chatPage.isTyping : t.chatPage.areTyping}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 p-4">

                            {/* Recording indicator */}
                            {isRecording && (
                                <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl border border-red-200/50 dark:border-red-800/50 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-red-600 dark:text-red-400 font-medium">
                                            {t.chatPage.recording}: {formatRecordingTime(recordingTime)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={stopRecording}
                                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors shadow-md"
                                    >
                                        {t.chatPage.stop}
                                    </button>
                                </div>
                            )}

                            {/* Attachment preview */}
                            {attachment && (
                                <div className="mb-4 relative">
                                    {attachment.type === 'image' ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={attachment.preview || ''}
                                                alt={t.chatPage.preview}
                                                className="h-28 w-auto rounded-2xl object-cover shadow-md"
                                            />
                                            <button
                                                onClick={removeAttachment}
                                                className="absolute -top-2 -right-2 cursor-pointer bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{attachment.file.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <button
                                                onClick={removeAttachment}
                                                className="ml-3 cursor-pointer text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex space-x-3">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={message}
                                        onChange={handleInputChange}
                                        placeholder={t.chatPage.typeMessage}
                                        className="w-full px-5 py-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white pl-5 pr-20 transition-all duration-300"
                                        disabled={isRecording}
                                    />
                                    <div className="absolute right-3 top-3 flex space-x-2">
                                        {!isRecording ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={startRecording}
                                                    className="p-2 text-gray-400 cursor-pointer hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300"
                                                    title={t.chatPage.recordVoiceMessage}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="p-2 text-gray-400 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300"
                                                    title={t.chatPage.attachFile}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleFileSelect}
                                                    accept="image/*,video/*,audio/*"
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!message.trim() && !attachment) || isUploading || isRecording}
                                    className="px-6 cursor-pointer bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:scale-105 transition-all duration-300 min-w-[60px]"
                                >
                                    {isUploading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50/50 to-blue-50/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-sm p-4">
                        <div className="text-center max-w-md mx-auto">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                                {t.chatPage.selectConversation}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                {t.chatPage.chooseConversationDescription}
                            </p>
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-600/50 text-left mb-6">
                                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t.chatPage.howToStartChat}:
                                </h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                    <li className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                        {t.chatPage.clickContactVendor}
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                        {t.chatPage.useChatSupport}
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                        {t.chatPage.selectFromRecent}
                                    </li>
                                </ul>
                            </div>
                            <button
                                className="md:hidden px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium"
                                onClick={() => setIsMobileSidebarOpen(true)}
                            >
                                {t.chatPage.openConversations}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Call Modal */}
            {activeCall && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-700/50 backdrop-blur-xl">
                        {/* Call Header with User Info */}
                        <div className="p-8 text-center border-b border-gray-700/50">
                            <div className="relative mx-auto w-28 h-28 mb-6">
                                {getOtherParticipant(activeConversation)?.avatar ? (
                                    <img
                                        src={getOtherParticipant(activeConversation)?.avatar}
                                        alt={getOtherParticipant(activeConversation)?.name}
                                        className="w-full h-full rounded-2xl object-cover shadow-2xl"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
                                        {getOtherParticipant(activeConversation)?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900 shadow-lg"></div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">
                                {getOtherParticipant(activeConversation)?.name || t.chatPage.unknownUser}
                            </h2>

                            <div className="flex items-center justify-center space-x-2 text-gray-300 mb-4">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm">
                                    {activeCall.type === "video" ? t.chatPage.videoCall : t.chatPage.voiceCall} • {t.chatPage.connected}
                                </span>
                            </div>

                            <div className="mt-4">
                                <p className="text-blue-400 font-mono text-xl font-medium bg-blue-500/10 px-4 py-2 rounded-xl inline-block">
                                    {formatCallDuration(callDuration)}
                                </p>
                            </div>
                        </div>

                        {/* Video/Audio Content */}
                        <div className="p-8">
                            {activeCall.type === "video" ? (
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {/* Local Video (You) */}
                                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-gray-600/50">
                                        <video
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1.5 rounded-xl text-xs flex items-center backdrop-blur-sm">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            {t.chatPage.you}
                                        </div>
                                    </div>

                                    {/* Remote Video (Other Participant) */}
                                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-gray-600/50">
                                        <video
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1.5 rounded-xl text-xs flex items-center backdrop-blur-sm">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            {getOtherParticipant(activeConversation)?.name || t.chatPage.participant}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center mb-8">
                                    <div className="relative mx-auto w-36 h-36 mb-6">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 animate-pulse"></div>
                                        <div className="relative w-full h-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center text-white text-5xl shadow-2xl">
                                            {getOtherParticipant(activeConversation)?.avatar ? (
                                                <img
                                                    src={getOtherParticipant(activeConversation)?.avatar}
                                                    alt={getOtherParticipant(activeConversation)?.name}
                                                    className="w-28 h-28 rounded-2xl object-cover"
                                                />
                                            ) : (
                                                <span className="text-4xl font-bold">
                                                    {getOtherParticipant(activeConversation)?.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        {t.chatPage.calling} {getOtherParticipant(activeConversation)?.name || t.chatPage.user}
                                    </p>
                                </div>
                            )}

                            {/* Call Controls */}
                            <div className="flex justify-center space-x-4">
                                {/* Mute/Unmute */}
                                <button
                                    onClick={toggleMute}
                                    className={`w-16 h-16 cursor-pointer rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isMuted
                                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                                        : 'bg-gray-700 hover:bg-gray-600 shadow-lg shadow-gray-700/30'
                                        }`}
                                    title={isMuted ? t.chatPage.unmute : t.chatPage.mute}
                                >
                                    {isMuted ? (
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                </button>

                                {/* Speaker */}
                                <button
                                    className="w-16 h-16 cursor-pointer rounded-2xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg shadow-gray-700/30"
                                    title={t.chatPage.speaker}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1.535 10.971c.073-1.208.11-1.813.424-2.394a3.2 3.2 0 0 1 1.38-1.3C3.94 7 4.627 7 6 7c.512 0 .768 0 1.016-.042a3 3 0 0 0 .712-.214c.23-.101.444-.242.871-.524l.22-.144C11.36 4.399 12.632 3.56 13.7 3.925c.205.07.403.17.58.295c.922.648.993 2.157 1.133 5.174A68 68 0 0 1 15.5 12c0 .532-.035 1.488-.087 2.605c-.14 3.018-.21 4.526-1.133 5.175a2.3 2.3 0 0 1-.58.295c-1.067.364-2.339-.474-4.882-2.151L8.6 17.78c-.427-.282-.64-.423-.871-.525a3 3 0 0 0-.712-.213C6.768 17 6.512 17 6 17c-1.374 0-2.06 0-2.66-.277a3.2 3.2 0 0 1-1.381-1.3c-.314-.582-.35-1.186-.424-2.395A17 17 0 0 1 1.5 12c0-.323.013-.671.035-1.029Z" /><path strokeLinecap="round" d="M20 6s1.5 1.8 1.5 6s-1.5 6-1.5 6" opacity="0.4" /><path strokeLinecap="round" d="M18 9s.5.9.5 3s-.5 3-.5 3" opacity="0.7" /></g></svg>
                                </button>

                                {/* End Call */}
                                <button
                                    onClick={handleEndCall}
                                    className="w-20 h-20 cursor-pointer bg-red-500 hover:bg-red-600 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-2xl shadow-red-500/40"
                                    title={t.chatPage.endCall}
                                >
                                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Camera Toggle (Video calls only) */}
                                {activeCall.type === "video" && (
                                    <button
                                        className="w-16 h-16 cursor-pointer rounded-2xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg shadow-gray-700/30"
                                        title={t.chatPage.toggleCamera}
                                    >
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Call Participants Info */}
                        <div className="p-6 bg-gray-800/50 border-t border-gray-700/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {t.chatPage.participants}: 2
                                </span>
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                    </svg>
                                    {t.chatPage.connection}: {t.chatPage.excellent}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;