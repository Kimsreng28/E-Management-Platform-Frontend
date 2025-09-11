// components/ui/customer/ChatModal.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { User } from '@/contexts/ChatContext';
import { IoClose, IoSend } from 'react-icons/io5';
import { motion, AnimatePresence } from "framer-motion";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: User;
}

export default function ChatModal({ isOpen, onClose, agent }: ChatModalProps) {
  const {
    messages,
    sendMessage,
    activeConversation,
    findOrCreateConversation,
    emitTypingEvent
  } = useChat();

  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Initialize conversation only once when modal opens
  useEffect(() => {
    if (isOpen && agent && !hasInitialized && !isInitializing) {
      const initializeChat = async () => {
        setIsInitializing(true);
        try {
          await findOrCreateConversation(agent.id);
          setHasInitialized(true);
        } catch (error) {
          console.error("Failed to initialize chat:", error);
        } finally {
          setIsInitializing(false);
        }
      };
      initializeChat();
    }
  }, [isOpen, agent, findOrCreateConversation, hasInitialized, isInitializing]);

  // Reset initialization state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      setIsInitializing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() && activeConversation) {
      await sendMessage(message.trim());
      setMessage('');
      stopTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Emit typing event
    if (activeConversation && !isTyping) {
      setIsTyping(true);
      emitTypingEvent(activeConversation.id, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (activeConversation) {
          emitTypingEvent(activeConversation.id, false);
        }
      }, 1000);
    }
  };

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    if (activeConversation) {
      emitTypingEvent(activeConversation.id, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [activeConversation, emitTypingEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Emit stop typing when component unmounts
      if (activeConversation && isTyping) {
        emitTypingEvent(activeConversation.id, false);
      }
    };
  }, [activeConversation, isTyping, emitTypingEvent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"> {agent.avatar ? (<img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full" />) : (<span className="text-sm font-medium text-gray-600"> {agent.name.charAt(0).toUpperCase()} </span>)} </div>
            <div>
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="text-sm opacity-80">Delivery Agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer rounded-full hover:bg-white/20 transition"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-white dark:to-gray-900">
          {isInitializing ? (
            <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
              <p>Initializing chat...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
              <p>Start a conversation with {agent.name}</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.user_id === agent.id ? "justify-start" : "justify-end"
                    }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl shadow ${msg.user_id === agent.id
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                      : "bg-blue-600 text-white rounded-br-none"
                      }`}
                  >
                    <p className="text-sm">{msg.body}</p>
                    <p className="text-[10px] opacity-70 mt-1 text-right">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400 italic">
            {agent.name} is typing...
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isInitializing || !activeConversation}
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isInitializing || !activeConversation}
              className="p-3 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <IoSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}