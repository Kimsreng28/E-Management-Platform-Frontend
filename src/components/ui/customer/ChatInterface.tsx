"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import Swal from 'sweetalert2';

const ChatInterface: React.FC = () => {
    const [message, setMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'agents' | 'customers'>('agents');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const {
        conversations,
        activeConversation,
        messages,
        deliveryAgents,
        customers,
        isLoading,
        setActiveConversation,
        sendMessage,
        emitTypingEvent,
        findOrCreateConversation,
        markAsRead,
        fetchConversations,
        typingUsers,
    } = useChat();

    const [user, setUser] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            setUser(storedUser ? JSON.parse(storedUser) : null);
        }
    }, []);

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
        if (!message.trim() || !activeConversation) return;

        try {
            await sendMessage(message);
            setMessage('');

            // Stop typing indicator immediately after sending
            emitTypingEvent(activeConversation.id, false);
            setIsTyping(false);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to send message',
                text: 'Please try again',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
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
                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                            <div className="space-y-4">
                                {messages && messages.length > 0 ? (
                                    messages.map((msg, index) => (
                                        <div
                                            key={`${msg.id}-${index}`}
                                            className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.user_id === user?.id
                                                    ? 'bg-blue-500 text-white rounded-br-none'
                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-sm'
                                                    }`}
                                            >
                                                <p>{msg.body}</p>
                                                <div className={`flex justify-end mt-1 ${msg.user_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                                    <span className="text-xs">
                                                        {parseTimestamp(msg.created_at)}
                                                        {msg.user_id === user?.id && (
                                                            <span className="ml-2">{msg.read_at ? 'Seen' : 'Delivered'}</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                                        </div>
                                    </div>
                                )}

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
                            <form onSubmit={handleSendMessage} className="flex space-x-2">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={message}
                                        onChange={handleInputChange}
                                        placeholder="Type a message..."
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pl-5 pr-12"
                                    />
                                    <div className="absolute right-3 top-3 flex space-x-1">
                                        <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!message.trim()}
                                    className="px-5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
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
        </div>
    );
};

export default ChatInterface;