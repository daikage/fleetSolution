import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Send, User as UserIcon } from 'lucide-react';
import axios from 'axios';

export default function Chat() {
    const { auth } = usePage().props;
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchConversation(selectedUser.id);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (conversation) {
            // Subscribe to private channel for this conversation
            const channel = window.Echo.private(`conversation.${conversation.id}`)
                .listen('.message.sent', (e) => {
                    setMessages((prev) => [...prev, e.message]);
                });

            return () => {
                window.Echo.leave(`conversation.${conversation.id}`);
            };
        }
    }, [conversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/chat/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchConversation = async (userId) => {
        try {
            const res = await axios.post(`/api/chat/users/${userId}`);
            setConversation(res.data);
            
            // Then fetch messages
            const msgRes = await axios.get(`/api/chat/conversations/${res.data.id}/messages`);
            setMessages(msgRes.data);
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversation) return;

        try {
            const res = await axios.post(`/api/chat/conversations/${conversation.id}/messages`, {
                content: newMessage
            });
            setMessages((prev) => [...prev, res.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <DashboardLayout>
            <Head title="Chat" />
            
            <div className="p-4 lg:p-8 h-full flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Messaging</h1>
                </div>

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
                                    {messages.map((msg) => (
                                        <div 
                                            key={msg.id} 
                                            className={`flex ${msg.sender_id === auth.user.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div 
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                                                    msg.sender_id === auth.user.id 
                                                        ? 'bg-electric-blue text-white rounded-br-sm' 
                                                        : 'bg-gray-800 text-gray-100 border border-white/5 rounded-bl-sm'
                                                }`}
                                            >
                                                <p>{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${msg.sender_id === auth.user.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 border-t border-white/5 bg-gray-900/50">
                                    <form onSubmit={sendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newMessage.trim()}
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
        </DashboardLayout>
    );
}
