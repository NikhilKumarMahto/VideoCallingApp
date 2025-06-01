import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CardItemProps {
    name: string;
}

const CardItem: React.FC<CardItemProps> = ({ name }) => {
    const handleAudioCall = () => {
        console.log(`Audio call with ${name}`);
    };

    const handleVideoCall = () => {
        console.log(`Video call with ${name}`);
    };

    const handleChat = () => {
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
