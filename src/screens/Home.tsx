import React, {useEffect, useState} from 'react';
import {
    SafeAreaView,
    StyleSheet,
    FlatList, Alert,
} from 'react-native';
import CardItem from '../components/Card.tsx';
interface CardData {
    id: string;
    name: string;
}
import firestore from '@react-native-firebase/firestore';

const data: CardData[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
    { id: '4', name: 'David' },
    { id: '5', name: 'Eve' },
];

const Home: React.FC = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        const usersCollection = firestore().collection('users');

        const subscriber = usersCollection
            .onSnapshot(
                (querySnapshot) => {
                    const fetchedUsers = [];
                    querySnapshot.forEach((documentSnapshot) => {
                        fetchedUsers.push({
                            id: documentSnapshot.id,
                            ...documentSnapshot.data(),
                        });
                    });

                    setUsers(fetchedUsers);
                    setLoading(false);
                },
                (error) => {
                    console.error('Error fetching users from Firestore:', error);
                    Alert.alert(
                        'Error',
                        'Failed to load users. Please check your internet connection and Firestore Security Rules.'
                    );
                    setLoading(false);
                }
            );

        return () => subscriber();
    }

    useEffect(() => {
        fetchData();
    }, []);

    console.log("data===>", users);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList<CardData>
                data={users}
                renderItem={({ item }) => <CardItem name={item.name} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    listContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
});

export default Home;