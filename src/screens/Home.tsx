import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    FlatList,
    Alert,
    View,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
} from 'react-native';
import CardItem from '../components/Card.tsx';
interface CardData {
    id: string;
    name: string;
}
import { getFirestore, collection, onSnapshot, query, where, doc, updateDoc } from '@react-native-firebase/firestore';
import { getAuth, signOut } from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Home: React.FC = ({ navigation }: any) => {
    const [users, setUsers] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [userName, setUserName] = useState<string>('');

    // Initialize Firestore instance once (modular API)
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Listen for incoming calls (callee)
    useEffect(() => {
        if (!currentUser) { return; }
        const callsQuery = query(
            collection(db, 'calls'),
            where('calleeId', '==', currentUser.uid),
            where('status', '==', 'calling')
        );
        const unsubscribe = onSnapshot(callsQuery, (snapshot) => {
            if (!snapshot) { return; } // Prevent null snapshot errors
            snapshot.docChanges().forEach((change: any) => {
                if (change.type === 'added') {
                    const callId = change.doc.id;
                    // Update call status to avoid duplicate navigation
                    const callDocRef = doc(db, 'calls', callId);
                    updateDoc(callDocRef, { status: 'ringing' });
                    navigation.navigate('Call', { callId, isCaller: false });
                }
            });
        });
        return () => unsubscribe();
    }, [db, navigation, currentUser]);

    // Get current user's name from Firestore
    useEffect(() => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const unsubscribe = onSnapshot(userDocRef, (docSnap: any) => {
                if (docSnap.exists) {
                    setUserName(docSnap.data().name || currentUser.email || 'User');
                } else {
                    setUserName(currentUser.email || 'User');
                }
            });
            return () => unsubscribe();
        }
    }, [db, currentUser]);

    // Listen for all users
    useEffect(() => {
        const usersCollection = collection(db, 'users');
        const unsubscribe = onSnapshot(usersCollection, (querySnapshot: any) => {
            const fetchedUsers: CardData[] = [];
            querySnapshot.forEach((documentSnapshot: any) => {
                fetchedUsers.push({
                    id: documentSnapshot.id,
                    ...documentSnapshot.data(),
                } as CardData);
            });
            setUsers(fetchedUsers);
            setLoading(false);
        }, (error: any) => {
            console.error('Error fetching users from Firestore:', error);
            Alert.alert(
                'Error',
                'Failed to load users. Please check your internet connection and Firestore Security Rules.'
            );
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setShowLogoutModal(false);
            navigation.replace('Login');
        } catch (error: any) {
            Alert.alert('Logout Error', error.message || 'Failed to logout.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello {userName}</Text>
                <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={styles.logoutIcon}>
                    <Icon name="logout" size={28} color="#007AFF" />
                </TouchableOpacity>
            </View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList<CardData>
                    data={users}
                    renderItem={({ item }) => (
                        <CardItem
                            name={item.name}
                            id={item.id}
                            navigation={navigation}
                            currentUserId={currentUser?.uid || ''}
                        />
                    )
                    }
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
            <Modal
                visible={showLogoutModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Are you sure you want to logout?</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.logoutButton]}
                                onPress={handleLogout}
                            >
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    greeting: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    logoutIcon: {
        padding: 6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 24,
        width: 300,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 18,
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 6,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e0e0e0',
    },
    logoutButton: {
        backgroundColor: '#007AFF',
    },
    cancelText: {
        color: '#333',
        fontWeight: '600',
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default Home;
