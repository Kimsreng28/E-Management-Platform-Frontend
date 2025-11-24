"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Message, useChat } from '@/contexts/ChatContext';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '@/lib/config';
import { CiMicrophoneOn, CiMicrophoneOff } from "react-icons/ci";

interface Attachment {
    file: File;
    preview: string | null;
    type: 'image' | 'file' | 'video' | 'voice';
}

const ChatInterface: React.FC = () => {
    const [message, setMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'agents' | 'customers'>('agents');
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

    const {
        conversations,
        activeConversation,
        messages,
        deliveryAgents,
        customers,
        isLoading,
        isUploading,
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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            setUser(storedUser ? JSON.parse(storedUser) : null);
        }
    }, []);

    // this effect to track call duration
    useEffect(() => {
        if (isInCall && activeCall) {
            const startTime = callStartTime || Date.now();
            setCallStartTime(startTime); // Ensure start time is set

            callDurationRef.current = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else {
            if (callDurationRef.current) {
                clearInterval(callDurationRef.current);
            }
            setCallDuration(0);
            setCallStartTime(null); // Reset start time
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
                title: 'Microphone access required',
                text: 'Please allow microphone access to send voice messages',
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

    const handleStartChat = async (chatUser: any, userType: 'agent' | 'customer') => {
        setSelectedUser(chatUser);
        try {
            await findOrCreateConversation(chatUser.id);
            fetchConversations();
            setIsMobileSidebarOpen(false);
        } catch (error) {
            console.error('Failed to start chat:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to start chat',
                text: 'Please try again later',
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
            // Error is now handled in the sendMessageWithAttachment function
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
                title: 'File too large',
                text: 'Please select a file smaller than 10MB',
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
                title: 'Message updated',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            console.error('Failed to edit message:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to edit message',
                text: error instanceof Error ? error.message : 'Please try again',
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
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteMessage(messageId);
                setShowMessageMenu(null);
                Swal.fire({
                    icon: 'success',
                    title: 'Message deleted',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } catch (error) {
                console.error('Failed to delete message:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to delete message',
                    text: error instanceof Error ? error.message : 'Please try again',
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

    // Filter conversations by type
    const agentConversations = conversations.filter(conv =>
        conv.type === 'customer_to_delivery' ||
        (conv.participants && conv.participants.some((p: any) =>
            deliveryAgents.some(agent => agent.id === p.id)
        ))
    );

    const customerConversations = conversations.filter(conv =>
        conv.type === 'customer_to_customer' ||
        (conv.participants && conv.participants.some((p: any) =>
            customers.some(customer => customer.id === p.id) && p.id !== user?.id
        ))
    );

    // Show notification for new messages when not in active conversation
    useEffect(() => {
        conversations.forEach(conv => {
            if (conv.unread_count && conv.unread_count > 0 &&
                (!activeConversation || activeConversation.id !== conv.id)) {

                const otherParticipant = getOtherParticipant(conv);
                if (otherParticipant) {
                    Swal.fire({
                        title: `New message from ${otherParticipant.name}`,
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
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Mobile sidebar toggle */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    className="p-2 rounded-md bg-blue-500 text-white shadow-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed md:relative inset-y-0 left-0 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300 ease-in-out shadow-lg`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Messages</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Chat with agents and customers</p>
                    </div>
                    <button
                        className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Tabs for switching between agents and customers */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <button
                        className={`flex-1 py-3 text-center font-medium ${activeTab === 'agents'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        onClick={() => setActiveTab('agents')}
                    >
                        Delivery Agents
                    </button>
                    <button
                        className={`flex-1 py-3 text-center font-medium ${activeTab === 'customers'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        Customers
                    </button>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                            {activeTab === 'agents' ? 'Available Agents' : 'Other Customers'}
                        </h3>
                        <div className="space-y-2">
                            {(activeTab === 'agents' ? deliveryAgents : customers.filter(customer => customer.id !== user?.id))
                                .map(person => (
                                    <div
                                        key={person.id}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${selectedUser?.id === person.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        onClick={() => handleStartChat(person, activeTab === 'agents' ? 'agent' : 'customer')}
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg shadow-sm">
                                                {person.avatar ? (
                                                    <img
                                                        src={person.avatar}
                                                        alt={person.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{person.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                        </div>
                                        <div className="ml-3 overflow-hidden">
                                            <p className="font-semibold truncate text-gray-800 dark:text-white">{person.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {activeTab === 'agents' ? 'Delivery Agent' : 'Customer'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Recent Conversations */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                            Recent Conversations
                        </h3>
                        <div className="space-y-2">
                            {(activeTab === 'agents' ? agentConversations : customerConversations).map(conversation => {
                                const otherParticipant = getOtherParticipant(conversation);
                                if (!otherParticipant) return null;

                                return (
                                    <div
                                        key={conversation.id}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${activeConversation?.id === conversation.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        onClick={() => {
                                            setActiveConversation(conversation);
                                            setIsMobileSidebarOpen(false);
                                        }}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg shadow-sm">
                                            {otherParticipant.avatar ? (
                                                <img
                                                    src={otherParticipant.avatar}
                                                    alt={otherParticipant.name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span>{otherParticipant.name?.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="ml-3 flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold truncate text-gray-800 dark:text-white">{otherParticipant.name}</p>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {conversation.latest_message && parseTimestamp(conversation.latest_message.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {conversation.latest_message?.body || 'No messages yet'}
                                            </p>
                                        </div>
                                        {conversation.unread_count && conversation.unread_count > 0 && (
                                            <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-800">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ml-3">
                        <p className="font-medium text-gray-800 dark:text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                ></div>
            )}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col w-full">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center">
                                <button
                                    className="md:hidden mr-3 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
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
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg shadow-sm">
                                                    {otherParticipant?.avatar ? (
                                                        <img
                                                            src={otherParticipant.avatar}
                                                            alt={otherParticipant.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>{otherParticipant?.name?.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-semibold text-gray-800 dark:text-white">{otherParticipant?.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(() => {
                                                        const typingUsersInConv = typingUsers[activeConversation.id] || [];
                                                        const otherTypingUsers = typingUsersInConv.filter(u => u !== user?.name);

                                                        if (otherTypingUsers.length > 0) {
                                                            return `${otherTypingUsers.join(', ')} ${otherTypingUsers.length === 1 ? 'is' : 'are'} typing...`;
                                                        }
                                                        return 'Online';
                                                    })()}
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            {/* Call Buttons */}
                            <div className="flex space-x-2">
                                {isInCall ? (
                                    <button
                                        onClick={handleEndCall}
                                        className="p-2 bg-red-500 cursor-pointer text-white rounded-full hover:bg-red-600"
                                        title="End Call"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M2 3a1 1 0 011-1h3a1 1 0 011 1v1h8V3a1 1 0 011-1h3a1 1 0 011 1v1a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2V3zm3 2v1h10V5H5zm10 5a1 1 0 01-1 1H6a1 1 0 110-2h8a1 1 0 011 1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleInitiateCall('audio')}
                                            className="p-2 bg-green-500 cursor-pointer text-white rounded-full hover:bg-green-600"
                                            title="Voice Call"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleInitiateCall('video')}
                                            className="p-2 bg-blue-500 cursor-pointer text-white rounded-full hover:bg-blue-600"
                                            title="Video Call"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div
                                        key={`${msg.id}-${index}`}
                                        className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                        onMouseEnter={() => msg.user_id === user?.id && setShowMessageMenu(msg.id)}
                                        onMouseLeave={() => setShowMessageMenu(null)}
                                    >
                                        <div className="relative group">
                                            {/* Message menu (only shown for user's own messages) */}
                                            {msg.user_id === user?.id && showMessageMenu === msg.id && (
                                                <div className="absolute -top-6 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 flex space-x-1 z-10">
                                                    <button
                                                        onClick={() => setEditingMessage(msg)}
                                                        className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                        title="Edit message"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        title="Delete message"
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
                                                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-blue-500 text-white rounded-br-none">
                                                    <input
                                                        type="text"
                                                        value={editingMessage.body}
                                                        onChange={(e) => setEditingMessage({ ...editingMessage, body: e.target.value })}
                                                        className="w-full bg-transparent border-none focus:ring-0 text-white"
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
                                                            className="text-xs bg-white text-blue-500 px-2 py-1 rounded"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMessage(null)}
                                                            className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Normal message display
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.user_id === user?.id
                                                        ? 'bg-blue-500 text-white rounded-br-none'
                                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-sm'
                                                        }`}
                                                >

                                                    {/* Render different message types */}
                                                    {msg.type === 'call' ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className={`p-2 rounded-full ${msg.call_status === 'ended' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
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
                                                                    {msg.call_status === 'ended' ? 'Call ended' : 'Call missed'}
                                                                </p>
                                                                <p className="text-xs">
                                                                    {msg.call_type === 'video' ? 'Video call' : 'Voice call'} •
                                                                    {msg.duration && msg.duration > 0
                                                                        ? ` ${formatCallDuration(msg.duration)}`
                                                                        : ' Call ended'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : msg.type === 'voice' ? (
                                                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-blue-100 dark:bg-blue-900 text-gray-800 dark:text-gray-100 shadow-sm max-w-xs">
                                                            {/* Play button */}
                                                            <button
                                                                onClick={() => {
                                                                    const audioEl = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                                                                    if (audioEl) {
                                                                        if (audioEl.paused) audioEl.play();
                                                                        else audioEl.pause();
                                                                    }
                                                                }}
                                                                className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
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
                                                                <div className="flex items-center space-x-2">
                                                                    {/* Fake waveform bars */}
                                                                    <div className="flex space-x-0.5">
                                                                        {[...Array(15)].map((_, i) => (
                                                                            <div
                                                                                key={i}
                                                                                className="w-0.5 bg-blue-500 dark:bg-blue-300 rounded"
                                                                                style={{ height: `${Math.random() * 12 + 4}px` }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-xs opacity-75">{msg.duration ? formatRecordingTime(msg.duration) : '0:00'}</span>
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
                                                                        alt="Shared image"
                                                                        className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                                                                        onError={(e) => {
                                                                            console.error('Failed to load image:', att.url);
                                                                            e.currentTarget.src = 'https://via.placeholder.com/150';
                                                                        }}
                                                                    />
                                                                ) : att.type === 'video' ? (
                                                                    <video
                                                                        controls
                                                                        className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                                                                        onError={(e) => {
                                                                            console.error('Failed to load video:', att.url);
                                                                        }}
                                                                    >
                                                                        <source src={att.url} type="video/mp4" />
                                                                        Your browser does not support the video tag.
                                                                    </video>
                                                                ) : null}
                                                                {msg.body && <p className="mt-2">{msg.body}</p>}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p>{msg.body}</p>
                                                    )}

                                                    <div className={`flex justify-end mt-1 ${msg.user_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                                        <span className="text-xs">
                                                            {parseTimestamp(msg.created_at)}
                                                            {msg.user_id === user?.id && (
                                                                <span className="ml-2">{msg.read_at ? 'Seen' : 'Delivered'}</span>
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
                                    ?.filter(u => u !== user?.name).length > 0 && (   // exclude current user
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {typingUsers[activeConversation.id].filter(u => u !== user?.name).join(', ')}
                                                    {" "}
                                                    {typingUsers[activeConversation.id].filter(u => u !== user?.name).length === 1 ? 'is' : 'are'} typing...
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">

                            {/* Recording indicator */}
                            {isRecording && (
                                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
                                        <span className="text-red-600 dark:text-red-400 font-medium">
                                            Recording: {formatRecordingTime(recordingTime)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={stopRecording}
                                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                                    >
                                        Stop
                                    </button>
                                </div>
                            )}

                            {/* Attachment preview */}
                            {attachment && (
                                <div className="mb-3 relative">
                                    {attachment.type === 'image' ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={attachment.preview || ''}
                                                alt="Preview"
                                                className="h-24 w-auto rounded-lg object-cover"

                                            />
                                            <button
                                                onClick={removeAttachment}
                                                className="absolute -top-2 -right-2 cursor-pointer bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="truncate flex-1">{attachment.file.name}</span>
                                            <button
                                                onClick={removeAttachment}
                                                className="ml-2 cursor-pointer text-red-500 hover:text-red-700"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex space-x-2">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={message}
                                        onChange={handleInputChange}
                                        placeholder="Type a message..."
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pl-5 pr-16"
                                        disabled={isRecording}
                                    />
                                    <div className="absolute right-3 top-3 flex space-x-1">
                                        {!isRecording ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={startRecording}
                                                    className="text-gray-400 cursor-pointer hover:text-red-500 dark:hover:text-red-400"
                                                    title="Record voice message"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                                                    title="Attach file"
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
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!message.trim() && !attachment) || isUploading || isRecording}
                                    className="px-5 cursor-pointer bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
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
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                        <div className="text-center max-w-md">
                            <div className="inline-block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Select a conversation</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Choose a contact from the sidebar to start chatting or select an existing conversation
                            </p>
                            <button
                                className="mt-4 md:hidden px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md"
                                onClick={() => setIsMobileSidebarOpen(true)}
                            >
                                Open Contacts
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Call Modal */}
            {activeCall && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-700">
                        {/* Call Header with User Info */}
                        <div className="p-6 text-center border-b border-gray-700">
                            <div className="relative mx-auto w-24 h-24 mb-4">
                                {getOtherParticipant(activeConversation)?.avatar ? (
                                    <img
                                        src={getOtherParticipant(activeConversation)?.avatar}
                                        alt={getOtherParticipant(activeConversation)?.name}
                                        className="w-full h-full rounded-full object-cover shadow-lg"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                        {getOtherParticipant(activeConversation)?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900"></div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">
                                {getOtherParticipant(activeConversation)?.name || 'Unknown User'}
                            </h2>

                            <div className="flex items-center justify-center space-x-2 text-gray-300 mb-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm">
                                    {activeCall.type === "video" ? "Video Call" : "Voice Call"} • Connected
                                </span>
                            </div>

                            <div className="mt-2">
                                <p className="text-blue-400 font-mono text-lg font-medium">
                                    {formatCallDuration(callDuration)}
                                </p>
                            </div>
                        </div>

                        {/* Video/Audio Content */}
                        <div className="p-6">
                            {activeCall.type === "video" ? (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {/* Local Video (You) */}
                                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                                        <video
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                            You
                                        </div>
                                    </div>

                                    {/* Remote Video (Other Participant) */}
                                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                                        <video
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                            {getOtherParticipant(activeConversation)?.name || "Participant"}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center mb-6">
                                    <div className="relative mx-auto w-32 h-32 mb-4">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
                                        <div className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center text-white text-4xl shadow-xl">
                                            {getOtherParticipant(activeConversation)?.avatar ? (
                                                <img
                                                    src={getOtherParticipant(activeConversation)?.avatar}
                                                    alt={getOtherParticipant(activeConversation)?.name}
                                                    className="w-20 h-20 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-3xl font-bold">
                                                    {getOtherParticipant(activeConversation)?.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        Calling {getOtherParticipant(activeConversation)?.name || 'User'}
                                    </p>
                                </div>
                            )}

                            {/* Call Controls */}
                            <div className="flex justify-center space-x-4">
                                {/* Mute/Unmute */}
                                <button
                                    onClick={toggleMute}
                                    className={`w-14 h-14 cursor-pointer rounded-full flex items-center justify-center transition-all duration-200 ${isMuted
                                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
                                        : 'bg-gray-700 hover:bg-gray-600 shadow-lg shadow-gray-700/25'
                                        }`}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                </button>

                                {/* Speaker */}
                                <button
                                    className="w-14 h-14 cursor-pointer rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all duration-200 shadow-lg shadow-gray-700/25"
                                    title="Speaker"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1.535 10.971c.073-1.208.11-1.813.424-2.394a3.2 3.2 0 0 1 1.38-1.3C3.94 7 4.627 7 6 7c.512 0 .768 0 1.016-.042a3 3 0 0 0 .712-.214c.23-.101.444-.242.871-.524l.22-.144C11.36 4.399 12.632 3.56 13.7 3.925c.205.07.403.17.58.295c.922.648.993 2.157 1.133 5.174A68 68 0 0 1 15.5 12c0 .532-.035 1.488-.087 2.605c-.14 3.018-.21 4.526-1.133 5.175a2.3 2.3 0 0 1-.58.295c-1.067.364-2.339-.474-4.882-2.151L8.6 17.78c-.427-.282-.64-.423-.871-.525a3 3 0 0 0-.712-.213C6.768 17 6.512 17 6 17c-1.374 0-2.06 0-2.66-.277a3.2 3.2 0 0 1-1.381-1.3c-.314-.582-.35-1.186-.424-2.395A17 17 0 0 1 1.5 12c0-.323.013-.671.035-1.029Z" /><path stroke-linecap="round" d="M20 6s1.5 1.8 1.5 6s-1.5 6-1.5 6" opacity="0.4" /><path stroke-linecap="round" d="M18 9s.5.9.5 3s-.5 3-.5 3" opacity="0.7" /></g></svg>
                                </button>

                                {/* End Call */}
                                <button
                                    onClick={handleEndCall}
                                    className="w-16 h-16 cursor-pointer bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-xl shadow-red-500/30"
                                    title="End Call"
                                >
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Camera Toggle (Video calls only) */}
                                {activeCall.type === "video" && (
                                    <button
                                        className="w-14 h-14 cursor-pointer rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all duration-200 shadow-lg shadow-gray-700/25"
                                        title="Toggle Camera"
                                    >
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Call Participants Info */}
                        <div className="p-4 bg-gray-800/50 border-t border-gray-700">
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Participants: 2
                                </span>
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                    </svg>
                                    Connection: Excellent
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