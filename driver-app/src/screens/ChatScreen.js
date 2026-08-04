import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api/config';
import { initEcho } from '../api/echo';

export default function ChatScreen({ route }) {
    const { user } = route.params;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const echoRef = useRef(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        setupChat();
        return () => {
            if (echoRef.current && conversation) {
                echoRef.current.leave(`conversation.${conversation.id}`);
            }
        };
    }, []);

    const setupChat = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            
            // Fetch current user id
            const userRes = await axios.get(`${API_BASE_URL}/api/user`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentUserId(userRes.data.id);

            // Fetch or create conversation
            const convRes = await axios.post(`${API_BASE_URL}/api/chat/users/${user.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const conv = convRes.data;
            setConversation(conv);

            // Fetch messages
            const msgRes = await axios.get(`${API_BASE_URL}/api/chat/conversations/${conv.id}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(msgRes.data);

            // Setup real-time connection
            echoRef.current = await initEcho();
            echoRef.current.private(`conversation.${conv.id}`)
                .listen('.message.sent', (e) => {
                    setMessages(prev => [...prev, e.message]);
                });

        } catch (error) {
            console.error('Error setting up chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !conversation) return;

        try {
            const token = await AsyncStorage.getItem('userToken');
            const content = newMessage;
            setNewMessage('');

            const res = await axios.post(`${API_BASE_URL}/api/chat/conversations/${conversation.id}/messages`, {
                content
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [...prev, res.data]);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const renderMessage = ({ item }) => {
        const isMine = item.sender_id === currentUserId;
        return (
            <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMine ? styles.myMessageText : null]}>{item.content}</Text>
                <Text style={styles.messageTime}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={!newMessage.trim()}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messagesContainer: { padding: 15, paddingBottom: 20 },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    myMessage: {
        backgroundColor: '#007BFF',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: { fontSize: 16, color: '#333' },
    myMessageText: { color: '#fff' },
    messageTime: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 4 },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    input: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 100,
        fontSize: 16
    },
    sendButton: {
        backgroundColor: '#007BFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginLeft: 10,
        justifyContent: 'center'
    },
    sendButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
