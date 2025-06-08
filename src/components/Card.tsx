import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getFirestore, collection, doc, setDoc } from '@react-native-firebase/firestore';

interface CardItemProps {
    name: string;
    id: string;
    navigation: any;
    currentUserId: string;
}

const CardItem: React.FC<CardItemProps> = ({ name, id, navigation, currentUserId }) => {
    const handleAudioCall = async () => {
        if (id === currentUserId) {
            // Prevent calling yourself
            return;
        }

        // Generate a unique callId
        const callId = `${currentUserId}_${id}_${Date.now()}`;
        // Use modular Firestore API
        const db = getFirestore();
        const callDocRef = doc(collection(db, 'calls'), callId);
        try {
            await setDoc(callDocRef, {
                callerId: currentUserId,
                calleeId: id,
                status: 'calling',
                createdAt: new Date().toISOString(),
            });
            console.log('Call document created:', callId);
            // Navigate to CallScreen as caller
            navigation.navigate('Call', { callId, isCaller: true });
        } catch (error) {
            console.error('Error creating call document:', error);
            // Optionally show an alert to the user
        }
        console.log("check1===");
    };

    const handleVideoCall = () => {
        // Placeholder for video call
        console.log(`Video call with ${name}`);
    };

    const handleChat = () => {
        // Placeholder for chat
        console.log(`Chat with ${name}`);
    };

    return (
        <View style={styles.card}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.iconsContainer}>
                <TouchableOpacity onPress={handleAudioCall} style={styles.iconButton}>
                    <Icon name="phone" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleVideoCall} style={styles.iconButton}>
                    <Icon name="video" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleChat} style={styles.iconButton}>
                    <Icon name="chat" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CardItem;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginLeft: 15,
        padding: 5,
    },
});
