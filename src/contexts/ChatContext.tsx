"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import initializeEcho from "@/lib/echo";
import { API_BASE_URL } from "@/lib/config";
import Swal from "sweetalert2";

// ---- Types ----
export interface User {
    id: number;
    name: string;
    avatar?: string | null;
}

export interface Message {
    id: number;
    body: string;
    type: string;
    user_id: number;
    conversation_id: number;
    created_at: string;
    read_at: string | null;
    user: User;
    attachments?: Attachment[];
    duration?: number;

    call_type?: 'audio' | 'video';
    call_status?: string;
    call_id?: string;
}

export interface Conversation {
    id: number;
    title: string | null;
    type: string;
    participants?: User[];
    latest_message?: Message;
    unread_count?: number;
    created_at: string;
    updated_at: string;
}

interface CallData {
    call_id: string;
    conversation_id: number;
    caller_id: number;
    receiver_id: number;
    type: 'audio' | 'video' | 'voice';
    status: 'initiated' | 'accepted' | 'rejected' | 'ended' | 'missed';
    duration?: number;
    reason?: string;
    ended_by?: number;
}

interface Attachment {
    type: 'image' | 'video' | 'voice';
    url: string;
}

interface CallOffer {
    call_id: string;
    type: 'audio' | 'video';
    offer: RTCSessionDescriptionInit;
    caller: User;
}

interface ICECandidate {
    candidate: RTCIceCandidateInit;
    call_id: string;
    user_id: number;
}

interface ChatContextType {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    deliveryAgents: User[];
    customers: User[];
    isLoading: boolean;
    isUploading: boolean;
    typingUsers: Record<number, string[]>;
    activeCall: CallData | null;
    isInCall: boolean;
    setActiveConversation: (conversation: Conversation | null) => void;
    sendMessage: (body: string, type?: string) => Promise<void>;
    sendVoiceMessage: (audioBlob: Blob, duration: number) => Promise<void>;
    sendMessageWithAttachment: (formData: FormData) => Promise<void>;
    markAsRead: (conversationId: number) => Promise<void>;
    findOrCreateConversation: (userId: number) => Promise<void>;
    fetchConversations: () => Promise<void>;
    fetchDeliveryAgents: () => Promise<void>;
    fetchCustomers: () => Promise<void>;
    emitTypingEvent: (conversationId: number, isTyping: boolean) => void;
    editMessage: (messageId: number, body: string) => Promise<void>;
    deleteMessage: (messageId: number) => Promise<void>;

    initiateCall: (type: 'audio' | 'video') => Promise<void>;
    acceptCall: (callId: string) => Promise<void>;
    rejectCall: (callId: string, reason?: string) => Promise<void>;
    endCall: (callId: string, duration?: number) => Promise<void>;
}

// ---- Context ----
const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within a ChatProvider");
    return context;
};

// ---- Provider ----
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [deliveryAgents, setDeliveryAgents] = useState<User[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [echo, setEcho] = useState<any>(null);
    const [typingUsers, setTypingUsers] = useState<Record<number, string[]>>({});

    const [activeCall, setActiveCall] = useState<CallData | null>(null);
    const [isInCall, setIsInCall] = useState(false);
    const [callStartTime, setCallStartTime] = useState<number | null>(null);
    const callDurationRef = useRef<NodeJS.Timeout | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const lastReadAtRef = React.useRef<Record<number, number>>({});
    const conversationRequestCache = new Map<number, Promise<any>>();

    const transformMessage = (msg: any): Message => {
        const attachments: Attachment[] = [];

        const isFullUrl = (url: string) => /^https?:\/\//i.test(url);

        // Check attachments array first
        if (msg.attachments && msg.attachments.length > 0) {
            for (const att of msg.attachments) {
                const url = isFullUrl(att.url) ? att.url : `${API_BASE_URL}${att.url}`;

                attachments.push({
                    type: att.type,
                    url: url,
                });
            }
        }

        // Fallback to old attachment_url (if attachments array is empty)
        else if (msg.attachment_url) {
            const url = isFullUrl(msg.attachment)
                ? msg.attachment
                : `${API_BASE_URL}/storage/${msg.attachment}`;

            attachments.push({
                type: msg.type as 'image' | 'video' | 'voice',
                url: url,
            });
        }

        return {
            ...msg,
            attachments,
            call_type: msg.call_type || null,
            call_status: msg.call_status || null,
            duration: msg.duration || null,
            call_id: msg.call_id || null,
        };
    };

    // Load user/token from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        console.log("Loading user/token from localStorage:", {
            hasToken: !!storedToken,
            hasUser: !!storedUser,
            userId: storedUser ? JSON.parse(storedUser).id : 'none'
        });

        setToken(storedToken);
        setUser(storedUser ? JSON.parse(storedUser) : null);
    }, []);

    // Setup Echo
    useEffect(() => {
        if (!token || !user) {
            console.log("Skipping Echo setup - missing token or user:", {
                hasToken: !!token,
                hasUser: !!user
            });
            return;
        }

        console.log("Setting up Echo with token for user:", user.id);
        const echoInstance = initializeEcho(token);
        setEcho(echoInstance);

        // Cleanup on unmount
        return () => {
            console.log(" Cleaning up Echo");
            if (echoInstance) {
                echoInstance.disconnect();
            }
        };
    }, [token, user]);

    // Listen to channel
    useEffect(() => {
        if (!echo) return;
        if (!user) return;
        if (!activeConversation) return;

        const channelName = `chat.${activeConversation.id}`;
        console.log("Subscribing to channel:", channelName);

        const channel = echo.join(channelName);

        const messageListener = (e: any) => {
            const rawMessage = e.message;
            console.log("Raw message received:", rawMessage);

            const newMessage = transformMessage(rawMessage);
            console.log("Transformed message:", newMessage);

            setMessages(prev => {
                if (prev.some(msg => msg.id === newMessage.id)) {
                    console.log("Message already exists, skipping");
                    return prev;
                }
                return [...prev, newMessage];
            });
        };

        const readListener = (e: any) => {
            // console.log("Message read event:", e);
            if (e.user_id !== user.id) {
                setConversations(prev =>
                    prev.map(conv =>
                        conv.id === e.conversation_id ? { ...conv, unread_count: 0 } : conv
                    )
                );
            }
        };

        // Typing listener for all conversations
        const typingListener = (e: any) => {
            console.log("Typing event received:", e);

            if (e.user_id === user.id) return; // ignore self

            setTypingUsers(prev => {
                const convTyping = prev[e.conversation_id] || [];
                if (!convTyping.includes(e.user_name)) {
                    return {
                        ...prev,
                        [e.conversation_id]: [...convTyping, e.user_name],
                    };
                }
                return prev;
            });
        };

        // Stop typing listener for all conversations
        const stopTypingListener = (e: any) => {
            console.log("Stop typing event received:", e);

            if (e.user_id === user.id) return; // ignore self

            setTypingUsers(prev => {
                const convTyping = prev[e.conversation_id] || [];
                return {
                    ...prev,
                    [e.conversation_id]: convTyping.filter(name => name !== e.user_name),
                };
            });
        };

        // Call event listeners
        const callInitiatedListener = (e: any) => {
            console.log("Call initiated event:", e);
            if (e.callData.caller_id !== user.id) {
                setActiveCall(e.callData);
                // Show call notification
                Swal.fire({
                    title: `Incoming ${e.callData.type} call`,
                    text: 'Would you like to answer?',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Answer',
                    cancelButtonText: 'Decline',
                    timer: 30000, // 30 seconds to answer
                    timerProgressBar: true
                }).then((result) => {
                    if (result.isConfirmed) {
                        acceptCall(e.callData.call_id);
                    } else {
                        rejectCall(e.callData.call_id, 'Call declined');
                    }
                });
            }
        };

        const callAcceptedListener = (e: any) => {
            console.log("Call accepted event:", e);
            if (e.callData.caller_id === user.id) {
                setIsInCall(true);
                setActiveCall(prev => prev ? { ...prev, status: 'accepted' } : null);
            }
        };

        const callRejectedListener = (e: any) => {
            console.log("Call rejected event:", e);

            // Clear active call for both parties
            setActiveCall(null);
            setIsInCall(false);

            // Add the call message to the chat for both parties
            if (e.message) {
                const callMessage = transformMessage(e.message);
                setMessages(prev => {
                    // Check if message already exists to avoid duplicates
                    if (prev.some(msg => msg.id === callMessage.id)) {
                        return prev;
                    }
                    return [...prev, callMessage];
                });
            }

            // Show notification for the caller
            if (e.callData.caller_id === user.id) {
                Swal.fire({
                    icon: 'info',
                    title: 'Call declined',
                    text: e.callData.reason || 'The call was declined',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        };

        const callEndedListener = (e: any) => {
            console.log("Call ended event:", e);
            setActiveCall(null);
            setIsInCall(false);

            // If there's a message in the event, add it to the messages
            if (e.message) {
                const callMessage = transformMessage(e.message);
                setMessages(prev => {
                    // Check if message already exists to avoid duplicates
                    if (prev.some(msg => msg.id === callMessage.id)) {
                        return prev;
                    }
                    return [...prev, callMessage];
                });
            }

            if (e.callData.ended_by !== user.id) {
                Swal.fire({
                    icon: 'info',
                    title: 'Call ended',
                    text: 'The other party ended the call',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        };

        channel.listen('.message.updated', (e: any) => {
            console.log("Message updated event:", e);

            setMessages(prev =>
                prev.map(msg => (msg.id === e.message.id ? { ...msg, ...e.message } : msg))
            );
        });

        channel.listen('.message.deleted', (e: any) => {
            console.log("Message deleted event:", e);

            setMessages(prev => prev.filter(msg => msg.id !== e.message_id));
        });

        channel.listen('.message.sent', messageListener);
        channel.listen('.message.read', readListener);
        channel.listen('.typing', typingListener);
        channel.listen('.stop-typing', stopTypingListener);

        // Call events
        channel.listen('.call.initiated', callInitiatedListener);
        channel.listen('.call.accepted', callAcceptedListener);
        channel.listen('.call.rejected', callRejectedListener);
        channel.listen('.call.ended', callEndedListener);

        // Cleanup when activeConversation changes
        return () => {
            console.log("Cleaning up channel listeners:", channelName);
            channel.stopListening('.message.sent', messageListener);
            channel.stopListening('.message.read', readListener);
            channel.stopListening('.typing', typingListener);
            channel.stopListening('.stop-typing', stopTypingListener);

            channel.stopListening('.call.initiated', callInitiatedListener);
            channel.stopListening('.call.accepted', callAcceptedListener);
            channel.stopListening('.call.rejected', callRejectedListener);
            channel.stopListening('.call.ended', callEndedListener);
            echo.leave(channelName);
        };
    }, [echo, user, activeConversation]);

    // Emit typing events
    const emitTypingEvent = useCallback((conversationId: number, isTyping: boolean) => {
        if (!token || !user) return;

        const endpoint = isTyping
            ? `${API_BASE_URL}/api/conversations/${conversationId}/typing`
            : `${API_BASE_URL}/api/conversations/${conversationId}/stop-typing`;

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    console.error('Typing event failed:', response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Typing event successful:', data);
            })
            .catch(err => {
                console.error('Failed to emit typing event:', err);
            });
    }, [token, user]);

    // Call functions
    const initiateCall = async (type: 'audio' | 'video') => {
        if (!token || !activeConversation) {
            throw new Error("No active conversation or authentication token");
        }

        const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            console.log('Initiating call:', { type, callId, conversationId: activeConversation.id });

            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/initiate-call`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ type, call_id: callId }),
            });

            // Get response text first for debugging
            const responseText = await res.text();
            console.log('Call initiation response:', { status: res.status, text: responseText });

            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('Failed to parse call response:', parseError);
                throw new Error('Invalid server response format');
            }

            if (!res.ok) {
                console.error('Call initiation failed:', { status: res.status, data });
                throw new Error(data.error || data.message || `Failed to initiate call (${res.status})`);
            }

            setActiveCall(data.call);
            return data.call;

        } catch (err) {
            console.error("[ChatProvider] Error initiating call", err);

            Swal.fire({
                icon: 'error',
                title: 'Call failed',
                text: err instanceof Error ? err.message : 'Could not initiate call',
                timer: 3000,
                showConfirmButton: false
            });

            throw err;
        }
    };

    const acceptCall = async (callId: string) => {
        if (!token || !activeConversation) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/accept-call`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ call_id: callId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to accept call");
            }

            setIsInCall(true);
            setActiveCall(prev => prev ? { ...prev, status: 'accepted' } : null);
            setCallStartTime(Date.now());
        } catch (err) {
            console.error("[ChatProvider] Error accepting call", err);
            throw err;
        }
    };

    const rejectCall = async (callId: string, reason?: string) => {
        if (!token || !activeConversation) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/reject-call`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ call_id: callId, reason }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to reject call");
            }

            // The message will be added via the event listener, so we don't need to do it here
            setActiveCall(null);
            setIsInCall(false);
        } catch (err) {
            console.error("[ChatProvider] Error rejecting call", err);
            throw err;
        }
    };

    const endCall = async (callId: string, duration?: number) => {
        if (!token || !activeConversation) return;

        try {
            const callDuration = duration || Math.floor((Date.now() - (callStartTime || Date.now())) / 1000);

            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/end-call`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    call_id: callId,
                    duration: callDuration
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to end call");
            }

            setActiveCall(null);
            setIsInCall(false);

            // Stop all media tracks
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                setLocalStream(null);
            }
        } catch (err) {
            console.error("[ChatProvider] Error ending call", err);
            throw err;
        }
    };

    useEffect(() => {
        return () => {
            if (callDurationRef.current) {
                clearInterval(callDurationRef.current);
            }
        };
    }, []);

    // Send voice message
    const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
        if (!token || !activeConversation) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('attachment', audioBlob, `voice_message_${Date.now()}.webm`);
            formData.append('type', 'voice');
            formData.append('duration', duration.toString());

            console.log('Sending voice message:', {
                duration,
                blobSize: audioBlob.size,
                blobType: audioBlob.type
            });

            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/messages`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            // Get response text first to see what's actually being returned
            const responseText = await res.text();
            console.log('Raw server response:', responseText);

            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError);
                throw new Error('Invalid server response');
            }

            if (!res.ok) {
                console.error('Server response status:', res.status);
                console.error('Server response data:', data);

                // Handle different types of errors
                if (res.status === 422) {
                    // Validation error
                    throw new Error(data.message || data.error || 'Validation failed');
                } else if (res.status === 413) {
                    throw new Error('File too large');
                } else if (res.status === 415) {
                    throw new Error('Unsupported file type');
                } else {
                    throw new Error(data.message || data.error || `Failed to send voice message (${res.status})`);
                }
            }

            const message = transformMessage(data.message);
            setMessages((prev) => [...prev, message]);

        } catch (err) {
            console.error("[ChatProvider] Error sending voice message", err);

            // Show user-friendly error message
            Swal.fire({
                icon: 'error',
                title: 'Failed to send voice message',
                text: err instanceof Error ? err.message : 'Please try again',
                timer: 3000,
                showConfirmButton: false
            });

            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    // Fetch all conversations (for sidebar)
    const fetchConversations = async () => {
        if (!token) {
            console.log("No token available for fetching conversations");
            return;
        }

        setIsLoading(true);
        console.log("Fetching conversations for user");

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Conversations received:", data.conversations.length, "conversations");

                const conversationsWithUnread = data.conversations.map((conv: any) => ({
                    ...conv,
                    unread_count: conv.unread_count || 0
                }));

                setConversations(conversationsWithUnread);
                console.log("Conversations state updated");
            } else {
                console.error("Failed to fetch conversations:", res.status, res.statusText);
            }
        } catch (err) {
            console.error("[ChatProvider] Failed to fetch conversations", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Start or load a conversation with a specific user
    const findOrCreateConversation = async (userId: number) => {
        if (!token) {
            console.log("No authentication token available");
            throw new Error("No authentication token");
        }

        console.log("Finding or creating conversation with user:", userId);

        // Check if there's already a pending request for this user
        if (conversationRequestCache.has(userId)) {
            console.log("Returning cached conversation request for user:", userId);
            return conversationRequestCache.get(userId);
        }

        try {
            const requestPromise = (async () => {
                const res = await fetch(`${API_BASE_URL}/api/conversations/find-or-create/${userId}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    console.error("Failed to find or create conversation:", res.status, res.statusText);

                    // Handle rate limiting specifically
                    if (res.status === 429) {
                        const retryAfter = res.headers.get('Retry-After') || '5';
                        const waitTime = parseInt(retryAfter) * 1000;

                        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));

                        // Retry the request
                        const retryRes = await fetch(`${API_BASE_URL}/api/conversations/find-or-create/${userId}`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        if (!retryRes.ok) {
                            throw new Error("Failed to find or create conversation after retry");
                        }

                        return await retryRes.json();
                    }

                    throw new Error("Failed to find or create conversation");
                }

                const data = await res.json();
                const conversation = data.conversation;
                console.log("Conversation found/created:", conversation.id);

                // Fetch messages for this conversation
                const msgRes = await fetch(`${API_BASE_URL}/api/conversations/${conversation.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!msgRes.ok) {
                    console.error("Failed to fetch conversation messages:", msgRes.status, msgRes.statusText);
                    throw new Error("Failed to fetch conversation messages");
                }

                const msgData = await msgRes.json();
                console.log("Messages fetched:", msgData.messages?.length || 0);

                const transformedMessages = (msgData.messages || []).map(transformMessage);

                setActiveConversation(conversation);
                setMessages(transformedMessages);
                console.log("Active conversation and messages updated");

                return conversation;
            })();

            // Store the promise in cache
            conversationRequestCache.set(userId, requestPromise);

            // Remove from cache after completion
            requestPromise.finally(() => {
                setTimeout(() => {
                    conversationRequestCache.delete(userId);
                }, 1000); // Keep in cache for 1 second to prevent rapid successive calls
            });

            return await requestPromise;
        } catch (err) {
            console.error("Error finding or creating conversation", err);
            throw err;
        }
    };

    // Send a message
    const sendMessage = async (body: string, type: string = "text") => {
        if (!token || !activeConversation) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ body, type }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send message");

            const message = transformMessage(data.message);

            setMessages((prev) => [...prev, message]);
        } catch (err) {
            console.error("[ChatProvider] Error sending message", err);
        }
    };

    // Send a message with attachment
    const sendMessageWithAttachment = async (formData: FormData) => {
        if (!token || !activeConversation) return;

        setIsUploading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/messages`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send message with attachment");

            const message = transformMessage(data.message);
            setMessages((prev) => [...prev, message]);
        } catch (err) {
            console.error("[ChatProvider] Error sending message with attachment", err);
        } finally {
            setIsUploading(false);
        }
    };


    // Mark conversation as read
    const markAsRead = async (conversationId: number) => {
        if (!token) {
            console.log(" No token available for marking as read");
            return;
        }

        const now = Date.now();
        const lastCalled = lastReadAtRef.current[conversationId];

        // Prevent duplicate calls within 5 seconds
        if (lastCalled && now - lastCalled < 5000) {
            console.log(`Skipping markAsRead for conversation ${conversationId} (recently called)`);
            return;
        }

        lastReadAtRef.current[conversationId] = now;

        console.log("Marking conversation as read:", conversationId);

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                console.log("Successfully marked conversation as read");
            } else {
                console.error("Failed to mark as read:", res.status, res.statusText);
            }
        } catch (err) {
            console.error("[ChatProvider] Error marking as read", err);
        }
    };

    // Fetch delivery agents
    const fetchDeliveryAgents = async () => {
        if (!token) {
            console.log("No token available for fetching delivery agents");
            return;
        }

        console.log("Fetching delivery agents");

        try {
            const res = await fetch(`${API_BASE_URL}/api/delivery-agents`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Delivery agents fetched:", data.delivery_agents?.length || 0);
                setDeliveryAgents(data.delivery_agents || []);
            } else {
                console.error(" Failed to fetch delivery agents:", res.status, res.statusText);
            }
        } catch (err) {
            console.error("[ChatProvider] Failed to fetch delivery agents", err);
        }
    };

    // Fetch customers
    const fetchCustomers = async () => {
        if (!token) {
            console.log("No token available for fetching customers");
            return;
        }

        console.log(" Fetching customers");

        try {
            const res = await fetch(`${API_BASE_URL}/api/customers-agents`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                console.log(" Customers fetched:", data.customers?.length || 0);
                setCustomers(data.customers || []);
            } else {
                console.error(" Failed to fetch customers:", res.status, res.statusText);
            }
        } catch (err) {
            console.error(" [ChatProvider] Failed to fetch customers", err);
        }
    };

    const fetchMessages = async (conversationId: number) => {
        if (!token) {
            console.log(" No token available for fetching messages");
            return;
        }

        console.log(" Fetching messages for conversation:", conversationId);

        try {
            const msgRes = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!msgRes.ok) {
                console.error(" Failed to fetch conversation messages:", msgRes.status, msgRes.statusText);
                throw new Error("Failed to fetch conversation messages");
            }

            const msgData = await msgRes.json();
            console.log(" Messages fetched:", msgData.messages?.length || 0);

            const transformedMessages = (msgData.messages || []).map(transformMessage);

            setMessages(transformedMessages);
        } catch (err) {
            console.error(" Error fetching messages", err);
        }
    };

    const handleSetActiveConversation = async (conversation: Conversation | null) => {
        console.log(" Setting active conversation:", conversation ? conversation.id : 'null');

        setActiveConversation(conversation);

        if (conversation) {
            await fetchMessages(conversation.id);
            if (user && conversation.unread_count && conversation.unread_count > 0) {
                await markAsRead(conversation.id);
            }
        } else {
            console.log(" Clearing messages (no active conversation)");
            setMessages([]);
        }
    };

    // Edit message
    const editMessage = async (messageId: number, body: string) => {
        if (!token || !activeConversation) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/messages/${messageId}/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ body }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to edit message");

            setMessages(prev =>
                prev.map(msg => (msg.id === data.message.id ? { ...msg, ...data.message } : msg))
            );
        } catch (err) {
            console.error("[ChatProvider] Error editing message", err);
        }
    };

    // Delete message
    const deleteMessage = async (messageId: number) => {
        if (!token || !activeConversation) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/messages/${messageId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete message");
            }

            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        } catch (err) {
            console.error("[ChatProvider] Error deleting message", err);
        }
    };

    // Initial load
    useEffect(() => {
        if (token) {
            console.log(" Initial load with token");
            fetchConversations();
            fetchDeliveryAgents();
            fetchCustomers();
        } else {
            console.log("⏭ Skipping initial load - no token");
        }
    }, [token]);

    return (
        <ChatContext.Provider
            value={{
                conversations,
                activeConversation,
                messages,
                deliveryAgents,
                customers,
                isLoading,
                isUploading,
                typingUsers,
                activeCall,
                isInCall,
                setActiveConversation: handleSetActiveConversation,
                sendMessage,
                sendVoiceMessage,
                sendMessageWithAttachment,
                markAsRead,
                findOrCreateConversation,
                fetchConversations,
                fetchDeliveryAgents,
                fetchCustomers,
                emitTypingEvent,
                editMessage,
                deleteMessage,
                initiateCall,
                acceptCall,
                rejectCall,
                endCall
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};