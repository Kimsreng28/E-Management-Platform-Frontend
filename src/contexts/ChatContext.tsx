
"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
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

interface ChatContextType {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    deliveryAgents: User[];
    customers: User[];
    isLoading: boolean;
    typingUsers: Record<number, string[]>;
    setActiveConversation: (conversation: Conversation | null) => void;
    sendMessage: (body: string, type?: string) => Promise<void>;
    markAsRead: (conversationId: number) => Promise<void>;
    findOrCreateConversation: (userId: number) => Promise<void>;
    fetchConversations: () => Promise<void>;
    fetchDeliveryAgents: () => Promise<void>;
    fetchCustomers: () => Promise<void>;
    emitTypingEvent: (conversationId: number, isTyping: boolean) => void;
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
    const [echo, setEcho] = useState<any>(null);
    const [typingUsers, setTypingUsers] = useState<Record<number, string[]>>({});

    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

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
            console.log("Message received:", e.message);

            const newMessage = e.message as Message;

            // Avoid duplicate messages
            setMessages(prev => {
                if (prev.some(msg => msg.id === e.message.id)) return prev;
                return [...prev, e.message];
            });

            // Update conversation latest_message and unread_count
            setConversations(prev =>
                prev.map(conv =>
                    conv.id === activeConversation.id
                        ? {
                            ...conv,
                            latest_message: e.message,
                            unread_count: 0, // active conversation, so mark read
                        }
                        : conv
                )
            );

            // SweetAlert for new messages from others
            if (newMessage.user_id !== user.id) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: `New message from ${newMessage.user.name}`,
                    text: newMessage.body,
                    timer: 3000,
                    showConfirmButton: false
                });
            }
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

        channel.listen('.message.sent', messageListener);
        channel.listen('.message.read', readListener);
        channel.listen('.typing', typingListener);
        channel.listen('.stop-typing', stopTypingListener);

        // Cleanup when activeConversation changes
        return () => {
            console.log("Cleaning up channel listeners:", channelName);
            channel.stopListening('.message.sent', messageListener);
            channel.stopListening('.message.read', readListener);
            channel.stopListening('.typing', typingListener);
            channel.stopListening('.stop-typing', stopTypingListener);
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

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/find-or-create/${userId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                console.error("Failed to find or create conversation:", res.status, res.statusText);
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

            setActiveConversation(conversation);
            setMessages(msgData.messages || []);
            console.log("Active conversation and messages updated");

        } catch (err) {
            console.error("Error finding or creating conversation", err);
        }
    };

    // Send a message
    const sendMessage = async (body: string, type: string = "text") => {
        if (!token) {
            console.log("No token available for sending message");
            return;
        }

        if (!activeConversation) {
            console.log("No active conversation for sending message");
            return;
        }

        console.log("Sending message:", { body, type, conversationId: activeConversation.id });

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/conversations/${activeConversation.id}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ body, type }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                console.error(" Failed to send message:", data.error || "Unknown error");
                throw new Error(data.error || "Failed to send message");
            }

            console.log(" Message sent successfully:", data.message.id);

            // Extract the message object from the response
            setMessages((prev) => {
                const newMessages = [...prev, data.message];
                console.log(" Messages after sending:", newMessages.length);
                return newMessages;
            });
        } catch (err) {
            console.error(" [ChatProvider] Error sending message", err);
        }
    };

    // Mark conversation as read
    const markAsRead = async (conversationId: number) => {
        if (!token) {
            console.log(" No token available for marking as read");
            return;
        }

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

            setMessages(msgData.messages || []);
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
                typingUsers,
                setActiveConversation: handleSetActiveConversation,
                sendMessage,
                markAsRead,
                findOrCreateConversation,
                fetchConversations,
                fetchDeliveryAgents,
                fetchCustomers,
                emitTypingEvent,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
