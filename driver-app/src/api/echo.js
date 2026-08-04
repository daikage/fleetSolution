import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

window.Pusher = Pusher;

export const initEcho = async () => {
    const token = await AsyncStorage.getItem('userToken');
    
    // Parse the host from API_BASE_URL for ws connection
    let host = 'localhost';
    let port = 8081;
    let scheme = 'http';
    let wssPort = 443;
    
    try {
        const url = new URL(API_BASE_URL);
        host = url.hostname;
        scheme = url.protocol.replace(':', '');
        port = url.port || (scheme === 'https' ? 443 : 80);
        wssPort = scheme === 'https' ? port : 443;
    } catch (e) {
        console.warn('Could not parse API_BASE_URL', e);
    }

    // In production on Laravel Cloud, Reverb might run on the same host but via wss
    // If it's a specific Reverb server, you'd configure it here.
    // For this app, we'll try to connect to the Reverb settings matching the backend.

    return new Echo({
        broadcaster: 'reverb',
        key: 'abx1u2kwpqnzvlmr4h9p', // from .env
        wsHost: host,
        wsPort: port,
        wssPort: wssPort,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            }
        }
    });
};
