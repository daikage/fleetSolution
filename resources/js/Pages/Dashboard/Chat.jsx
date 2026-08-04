import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Send, User as UserIcon, MessageSquare, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import axios from 'axios';

export default function Chat() {
    const { auth } = usePage().props;
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const messagesEndRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const conversationRef = useRef(null);
    const fileInputRef = useRef(null);

    // Keep conversationRef in sync
    useEffect(() => {
        conversationRef.current = conversation;
    }, [conversation]);

    useEffect(() => {
        fetchUsers();
        return () => {
            stopPolling();
        };
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchConversation(selectedUser.id);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (conversation) {
            // Start polling for new messages as a reliable fallback
            startPolling(conversation.id);

            // Also try WebSocket real-time updates if Echo is available
            let channel = null;
            if (window.Echo) {
                try {
                    channel = window.Echo.private(`conversation.${conversation.id}`)
                        .listen('.message.sent', (e) => {
                            setMessages((prev) => {
                                if (prev.some(m => m.id === e.message.id)) return prev;
                                return [...prev, e.message];
                            });
                        });
                } catch (err) {
                    console.warn('Echo not available, relying on polling:', err);
                }
            }

            return () => {
                stopPolling();
                if (channel && window.Echo) {
                    window.Echo.leave(`conversation.${conversation.id}`);
                }
            };
        }
    }, [conversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const startPolling = (conversationId) => {
        stopPolling();
        pollIntervalRef.current = setInterval(() => {
            fetchMessages(conversationId);
        }, 5000);
    };

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/chat/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users. Please refresh the page.');
        }
    };

    const fetchConversation = async (userId) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.post(`/api/chat/users/${userId}`);
            setConversation(res.data);
            await fetchMessages(res.data.id);
        } catch (error) {
            console.error('Error fetching conversation:', error);
            setError('Failed to load conversation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const msgRes = await axios.get(`/api/chat/conversations/${conversationId}/messages`);
            setMessages((prev) => {
                if (prev.length !== msgRes.data.length ||
                    (prev.length > 0 && msgRes.data.length > 0 && prev[prev.length - 1].id !== msgRes.data[msgRes.data.length - 1].id)) {
                    return msgRes.data;
                }
                return prev;
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be smaller than 10MB.');
            setTimeout(() => setError(null), 3000);
            return;
        }

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
            setError('Only JPEG, PNG, GIF, and WebP images are allowed.');
            setTimeout(() => setError(null), 3000);
            return;
        }

        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !conversation) return;

        const content = newMessage;
        const image = selectedImage;
        const preview = imagePreview;
        setNewMessage('');
        clearImage();

        // Optimistically add message to the UI
        const tempMessage = {
            id: `temp-${Date.now()}`,
            sender_id: auth.user.id,
            content: content,
            image_url: preview,
            created_at: new Date().toISOString(),
            sender: { id: auth.user.id, name: auth.user.name },
            _sending: true,
        };
        setMessages((prev) => [...prev, tempMessage]);

        try {
            const formData = new FormData();
            if (content) {
                formData.append('content', content);
            }
            if (image) {
                formData.append('image', image);
            }

            const res = await axios.post(
                `/api/chat/conversations/${conversation.id}/messages`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            // Replace temp message with real one
            setMessages((prev) =>
                prev.map(m => m.id === tempMessage.id ? res.data : m)
            );
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
            setNewMessage(content);
            setError('Failed to send message. Please try again.');
            setTimeout(() => setError(null), 3000);
        }
    };

    return (
        <DashboardLayout>
            <Head title="Chat" />

            <div className="p-4 lg:p-8 h-full flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Messaging</h1>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex-1 flex gap-6 overflow-hidden max-h-[calc(100vh-12rem)]">
                    {/* Users Sidebar */}
                    <div className="w-1/3 glass-panel rounded-2xl flex flex-col overflow-hidden border border-white/5 shadow-xl">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <h2 className="font-semibold text-white">Select a user</h2>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {users.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => setSelectedUser(u)}
                                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                                        selectedUser?.id === u.id
                                            ? 'bg-electric-blue/20 border border-electric-blue/30'
                                            : 'hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-white font-medium truncate">{u.name}</p>
                                        <p className="text-xs text-gray-400 capitalize truncate">{u.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="w-2/3 glass-panel rounded-2xl flex flex-col border border-white/5 shadow-xl overflow-hidden relative">
                        {selectedUser ? (
                            <>
                                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{selectedUser.name}</h3>
                                        <p className="text-xs text-gray-400 capitalize">{selectedUser.role}</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <RefreshCw className="w-8 h-8 text-gray-500 animate-spin" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            <p>No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender_id === auth.user.id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                                                        msg.sender_id === auth.user.id
                                                            ? 'bg-electric-blue text-white rounded-br-sm'
                                                            : 'bg-gray-800 text-gray-100 border border-white/5 rounded-bl-sm'
                                                    } ${msg._sending ? 'opacity-60' : ''}`}
                                                >
                                                    {msg.sender_id !== auth.user.id && msg.sender && (
                                                        <p className="text-[10px] text-electric-blue font-medium mb-1">{msg.sender.name}</p>
                                                    )}
                                                    {msg.image_url && (
                                                        <img
                                                            src={msg.image_url}
                                                            alt="Shared image"
                                                            className="rounded-xl max-w-full max-h-64 object-cover mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => setLightboxImage(msg.image_url)}
                                                        />
                                                    )}
                                                    {msg.content && <p>{msg.content}</p>}
                                                    <p className={`text-[10px] mt-1 text-right ${msg.sender_id === auth.user.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {msg._sending ? 'Sending...' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Image Preview Strip */}
                                {imagePreview && (
                                    <div className="px-4 pt-3 border-t border-white/5 bg-gray-900/30">
                                        <div className="relative inline-block">
                                            <img
                                                src={imagePreview}
                                                alt="Selected image"
                                                className="h-20 rounded-lg object-cover border border-white/10"
                                            />
                                            <button
                                                onClick={clearImage}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 border-t border-white/5 bg-gray-900/50">
                                    <form onSubmit={sendMessage} className="flex gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageSelect}
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl px-3 py-3 flex items-center justify-center transition-colors border border-gray-700"
                                            title="Attach image"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() && !selectedImage}
                                            className="bg-electric-blue hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-electric-blue text-white rounded-xl px-4 py-3 flex items-center justify-center transition-colors shadow-lg shadow-electric-blue/20"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a user to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 cursor-pointer"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Full size image"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </DashboardLayout>
    );
}
