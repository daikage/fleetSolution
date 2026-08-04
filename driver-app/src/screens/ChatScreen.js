import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
    const [selectedImage, setSelectedImage] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [isSending, setIsSending] = useState(false);
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
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === e.message.id)) return prev;
                        return [...prev, e.message];
                    });
                });

        } catch (error) {
            console.error('Error setting up chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission to access photos is required to send images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
            base64: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelectedImage(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission to access camera is required to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
            base64: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelectedImage(result.assets[0]);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && !selectedImage) || !conversation || isSending) return;

        setIsSending(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const content = newMessage;
            const image = selectedImage;
            setNewMessage('');
            setSelectedImage(null);

            const formData = new FormData();
            if (content.trim()) {
                formData.append('content', content);
            }
            if (image) {
                const uri = image.uri;
                const filename = uri.split('/').pop();
                const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
                const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
                formData.append('image', {
                    uri: uri,
                    name: filename,
                    type: mimeType,
                });
            }

            const res = await axios.post(
                `${API_BASE_URL}/api/chat/conversations/${conversation.id}/messages`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setMessages(prev => [...prev, res.data]);
        } catch (error) {
            console.error('Error sending message:', error?.response?.data || error.message);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isMine = item.sender_id === currentUserId;
        return (
            <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
                {!isMine && item.sender && (
                    <Text style={styles.senderName}>{item.sender.name}</Text>
                )}
                {item.image_url && (
                    <TouchableOpacity onPress={() => setLightboxImage(item.image_url)} activeOpacity={0.8}>
                        <Image
                            source={{ uri: item.image_url }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}
                {item.content ? (
                    <Text style={[styles.messageText, isMine ? styles.myMessageText : null]}>{item.content}</Text>
                ) : null}
                <Text style={[styles.messageTime, isMine ? styles.myMessageTime : null]}>
                    {item._sending ? 'Sending...' : new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* Image Preview */}
            {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.clearImageBtn} onPress={clearImage}>
                        <Text style={styles.clearImageText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Text style={styles.imageButtonText}>🖼</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                    <Text style={styles.cameraButtonText}>📷</Text>
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={(!newMessage.trim() && !selectedImage) || isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Lightbox Modal */}
            <Modal visible={!!lightboxImage} transparent animationType="fade" onRequestClose={() => setLightboxImage(null)}>
                <View style={styles.lightboxOverlay}>
                    <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxImage(null)}>
                        <Text style={styles.lightboxCloseText}>✕</Text>
                    </TouchableOpacity>
                    {lightboxImage && (
                        <Image
                            source={{ uri: lightboxImage }}
                            style={styles.lightboxImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
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
    senderName: {
        fontSize: 10,
        color: '#007BFF',
        fontWeight: '600',
        marginBottom: 4,
    },
    messageImage: {
        width: 220,
        height: 180,
        borderRadius: 12,
        marginBottom: 6,
    },
    messageText: { fontSize: 16, color: '#333' },
    myMessageText: { color: '#fff' },
    messageTime: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 4 },
    myMessageTime: { color: 'rgba(255,255,255,0.7)' },

    // Image preview
    imagePreviewContainer: {
        paddingHorizontal: 10,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
    },
    imagePreview: {
        width: 70,
        height: 70,
        borderRadius: 10,
    },
    clearImageBtn: {
        position: 'absolute',
        top: 4,
        left: 72,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearImageText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Input area
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    imageButton: {
        width: 40,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },
    imageButtonText: { fontSize: 22 },
    cameraButton: {
        width: 40,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    cameraButtonText: { fontSize: 22 },
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
        justifyContent: 'center',
        minWidth: 65,
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Lightbox
    lightboxOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lightboxClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    lightboxCloseText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    lightboxImage: {
        width: '90%',
        height: '80%',
    },
});
