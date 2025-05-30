// import React from 'react';
// import type {PropsWithChildren} from 'react';
// import {
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   useColorScheme,
//   View,
// } from 'react-native';
//
// import {
//   Colors,
//   DebugInstructions,
//   Header,
//   LearnMoreLinks,
//   ReloadInstructions,
// } from 'react-native/Libraries/NewAppScreen';
//
// type SectionProps = PropsWithChildren<{
//   title: string;
// }>;
//
// function Section({children, title}: SectionProps): React.JSX.Element {
//   const isDarkMode = useColorScheme() === 'dark';
//   return (
//     <View style={styles.sectionContainer}>
//       <Text
//         style={[
//           styles.sectionTitle,
//           {
//             color: isDarkMode ? Colors.white : Colors.black,
//           },
//         ]}>
//         {title}
//       </Text>
//       <Text
//         style={[
//           styles.sectionDescription,
//           {
//             color: isDarkMode ? Colors.light : Colors.dark,
//           },
//         ]}>
//         {children}
//       </Text>
//     </View>
//   );
// }
//
// function App(): React.JSX.Element {
//   const isDarkMode = useColorScheme() === 'dark';
//
//   const backgroundStyle = {
//     backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
//   };
//
//   /*
//    * To keep the template simple and small we're adding padding to prevent view
//    * from rendering under the System UI.
//    * For bigger apps the recommendation is to use `react-native-safe-area-context`:
//    * https://github.com/AppAndFlow/react-native-safe-area-context
//    *
//    * You can read more about it here:
//    * https://github.com/react-native-community/discussions-and-proposals/discussions/827
//    */
//   const safePadding = '5%';
//
//   return (
//     <View style={backgroundStyle}>
//       <StatusBar
//         barStyle={isDarkMode ? 'light-content' : 'dark-content'}
//         backgroundColor={backgroundStyle.backgroundColor}
//       />
//       <ScrollView
//         style={backgroundStyle}>
//         <View style={{paddingRight: safePadding}}>
//           <Header/>
//         </View>
//         <View
//           style={{
//             backgroundColor: isDarkMode ? Colors.black : Colors.white,
//             paddingHorizontal: safePadding,
//             paddingBottom: safePadding,
//           }}>
//           <Section title="Step One">
//             Edit <Text style={styles.highlight}>App.tsx</Text> to change this
//             screen and then come back to see your edits.
//           </Section>
//           <Section title="See Your Changes">
//             <ReloadInstructions />
//           </Section>
//           <Section title="Debug">
//             <DebugInstructions />
//           </Section>
//           <Section title="Learn More">
//             Read the docs to discover what to do next:
//           </Section>
//           <LearnMoreLinks />
//         </View>
//       </ScrollView>
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   sectionContainer: {
//     marginTop: 32,
//     paddingHorizontal: 24,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '600',
//   },
//   sectionDescription: {
//     marginTop: 8,
//     fontSize: 18,
//     fontWeight: '400',
//   },
//   highlight: {
//     fontWeight: '700',
//   },
// });
//
// export default App;



import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    PermissionsAndroid,
    Alert, // We'll replace this with a custom modal later
} from 'react-native';
import {
    RTCPeerConnection,
    RTCView,
    mediaDevices,
    RTCIceCandidate,
    RTCSessionDescription,
    MediaStream,
} from 'react-native-webrtc';
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/firestore';

// --- Firebase Configuration ---
// IMPORTANT: Replace with your actual Firebase config
// You can get this from your Firebase project settings
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    // measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

const firestore = firebase.firestore();

// --- STUN Server Configuration ---
// Using public Google STUN servers for this example
// For production, you'll likely need TURN servers as well
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN server configurations here if needed for NAT traversal
        // {
        //   urls: 'turn:your-turn-server.com:port',
        //   username: 'your-username',
        //   credential: 'your-password',
        // },
    ],
};

const App = () => {
    const [roomId, setRoomId] = useState('');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    // --- Refs for WebRTC objects ---
    // Using useRef to hold the peer connection instance
    // so it persists across re-renders without causing them
    const pc = useRef(null);
    // Ref to store ICE candidates temporarily before the remote peer is ready
    const remoteCandidates = useRef([]);


    // --- Utility to show alerts (replace with custom modal in production) ---
    const showMessage = (title, message) => {
        // In a real app, use a custom modal component instead of Alert
        Alert.alert(title, message);
    };


    // --- Permissions Handling ---
    useEffect(() => {
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const grants = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);
                if (
                    grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
                    grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
                ) {
                    console.log('Permissions granted');
                } else {
                    console.log('Permissions denied');
                    showMessage('Permissions Denied', 'Camera and microphone permissions are required for video calling.');
                }
            } catch (err) {
                console.warn(err);
                showMessage('Permission Error', 'Failed to request permissions.');
            }
        }
        // For iOS, permissions are typically handled via Info.plist entries:
        // NSCameraUsageDescription and NSMicrophoneUsageDescription
    };

    // --- Initialize Peer Connection ---
    const initializePeerConnection = () => {
        // Create a new RTCPeerConnection
        pc.current = new RTCPeerConnection(configuration);

        // --- Event Handlers for Peer Connection ---

        // Add local stream tracks to the peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.current.addTrack(track, localStream);
            });
        }

        // Handle ICE candidates: send them to the other peer via Firestore
        pc.current.onicecandidate = event => {
            if (event.candidate) {
                const roomRef = firestore.collection('rooms').doc(roomId);
                const candidateCollection = isCalling ? roomRef.collection('callerCandidates') : roomRef.collection('calleeCandidates');
                candidateCollection.add(event.candidate.toJSON());
            }
        };

        // Handle incoming remote stream
        pc.current.ontrack = event => {
            if (event.streams && event.streams[0]) {
                console.log('Remote stream received:', event.streams[0]);
                setRemoteStream(event.streams[0]);
            }
        };

        // Handle ICE connection state changes (for debugging/UI updates)
        pc.current.oniceconnectionstatechange = () => {
            console.log('ICE Connection State:', pc.current.iceConnectionState);
            // You can update UI based on states like 'connected', 'disconnected', 'failed'
            if (pc.current.iceConnectionState === 'failed' || pc.current.iceConnectionState === 'disconnected' || pc.current.iceConnectionState === 'closed') {
                // Potentially handle call drop or reconnection logic
                if (remoteStream) { // Only show if we were in a call
                    showMessage('Call Disconnected', 'The connection was lost.');
                    hangUp(); // Clean up
                }
            }
        };
    };


    // --- Start Local Media Stream ---
    const startLocalStream = async () => {
        try {
            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: {
                    facingMode: isFrontCamera ? 'user' : 'environment',
                    width: { ideal: 1280 }, // Request HD, but device may adjust
                    height: { ideal: 720 },
                },
            });
            setLocalStream(stream);
            console.log('Local stream acquired');
        } catch (error) {
            console.error('Error getting local stream:', error);
            showMessage('Stream Error', 'Could not start camera or microphone.');
        }
    };


    // --- Create Call (Caller Logic) ---
    const createCall = async () => {
        if (!roomId) {
            showMessage('Room ID Missing', 'Please enter a Room ID.');
            return;
        }
        if (!localStream) {
            await startLocalStream(); // Ensure local stream is started
            if (!localStream) { // Check again after attempting to start
                showMessage('Stream Error', 'Could not start local camera/mic. Cannot create call.');
                return;
            }
        }

        setIsCalling(true);
        initializePeerConnection(); // Initialize pc.current

        const roomRef = firestore.collection('rooms').doc(roomId);
        const roomSnapshot = await roomRef.get();

        if (!roomSnapshot.exists) {
            await roomRef.set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            console.log('Room created in Firestore');
        } else {
            // Potentially handle if room already exists and is active
            console.log('Room already exists. Joining as caller.');
        }

        // Create SDP offer
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);

        const roomWithOffer = {
            offer: {
                type: offer.type,
                sdp: offer.sdp,
            },
        };
        await roomRef.set(roomWithOffer, { merge: true }); // Use merge to not overwrite createdAt
        console.log('Offer sent to Firestore');

        // Listen for answer from callee
        roomRef.onSnapshot(async snapshot => {
            const data = snapshot.data();
            if (data && data.answer && !pc.current.remoteDescription) {
                console.log('Answer received from callee');
                const answerDescription = new RTCSessionDescription(data.answer);
                await pc.current.setRemoteDescription(answerDescription);
                console.log('Remote description (answer) set');

                // Process any queued remote ICE candidates
                remoteCandidates.current.forEach(candidate => {
                    console.log("Processing queued remote candidate (caller):", candidate);
                    pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                });
                remoteCandidates.current = []; // Clear queue
            }
        });

        // Listen for ICE candidates from callee
        const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
        calleeCandidatesCollection.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    if (pc.current && pc.current.remoteDescription) {
                        console.log("Adding callee ICE candidate immediately:", candidate);
                        await pc.current.addIceCandidate(candidate);
                    } else {
                        console.log("Queuing callee ICE candidate:", candidate);
                        remoteCandidates.current.push(candidate);
                    }
                }
            });
        });
    };

    // --- Join Call (Callee Logic) ---
    const joinCall = async () => {
        if (!roomId) {
            showMessage('Room ID Missing', 'Please enter a Room ID.');
            return;
        }
        if (!localStream) {
            await startLocalStream();
            if (!localStream) {
                showMessage('Stream Error', 'Could not start local camera/mic. Cannot join call.');
                return;
            }
        }

        setIsCalling(false); // Callee
        initializePeerConnection();

        const roomRef = firestore.collection('rooms').doc(roomId);
        const roomSnapshot = await roomRef.get();

        if (!roomSnapshot.exists || !roomSnapshot.data().offer) {
            showMessage('Room Not Found', 'Room does not exist or no offer found.');
            console.error('Room does not exist or no offer found.');
            return;
        }

        const offer = roomSnapshot.data().offer;
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Remote description (offer) set');

        // Create SDP answer
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        const roomWithAnswer = {
            answer: {
                type: answer.type,
                sdp: answer.sdp,
            },
        };
        await roomRef.update(roomWithAnswer);
        console.log('Answer sent to Firestore');

        // Listen for ICE candidates from caller
        const callerCandidatesCollection = roomRef.collection('callerCandidates');
        callerCandidatesCollection.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    if (pc.current && pc.current.remoteDescription) { // Ensure remote description is set
                        console.log("Adding caller ICE candidate immediately:", candidate);
                        await pc.current.addIceCandidate(candidate);
                    } else {
                        console.log("Queuing caller ICE candidate (this shouldn't happen often for callee):", candidate);
                        remoteCandidates.current.push(candidate); // Should be rare for callee
                    }
                }
            });
        });
        // Process any queued remote ICE candidates (less likely for callee but good practice)
        remoteCandidates.current.forEach(candidate => {
            console.log("Processing queued remote candidate (callee):", candidate);
            pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        });
        remoteCandidates.current = [];
    };

    // --- Hang Up Call ---
    const hangUp = async () => {
        // Close peer connection
        if (pc.current) {
            pc.current.close();
            pc.current = null; // Reset the ref
        }

        // Stop local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setIsCalling(false); // Reset calling state
        // remoteCandidates.current = []; // Clear any pending candidates

        // --- Firestore Cleanup (Important!) ---
        // A more robust cleanup would involve checking if the user is the room creator
        // or if other participants are still in the room.
        // For simplicity, this example might leave some data if not handled carefully.
        // Consider using Firebase Functions for more reliable cleanup on disconnect.
        if (roomId) {
            const roomRef = firestore.collection('rooms').doc(roomId);
            // Delete candidates subcollections
            const callerCandidates = await roomRef.collection('callerCandidates').get();
            callerCandidates.forEach(async doc => await doc.ref.delete());

            const calleeCandidates = await roomRef.collection('calleeCandidates').get();
            calleeCandidates.forEach(async doc => await doc.ref.delete());

            // Optionally, delete the room document itself or mark it as inactive
            // For this example, we'll clear offer/answer to allow reuse, but you might delete.
            // await roomRef.delete(); // This would remove the room entirely
            await roomRef.update({
                offer: firebase.firestore.FieldValue.delete(),
                answer: firebase.firestore.FieldValue.delete(),
            });
            console.log('Room data cleaned up in Firestore (offer/answer removed).');
        }
        setRoomId(''); // Clear room ID input
        showMessage('Call Ended', 'The call has been ended.');
    };

    // --- Switch Camera ---
    const switchCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                // For react-native-webrtc, you might need to stop the current stream
                // and get a new one with the different camera.
                // Or, if the track supports it (less common on mobile):
                // track._switchCamera(); // This is a common method name in some WebRTC libraries

                // Simpler approach: stop old stream, get new one
                track.stop();
            });
            setIsFrontCamera(!isFrontCamera); // Toggle state
            // Re-acquire stream with new camera setting
            // Note: This will trigger a new offer/answer cycle if in a call,
            // which is complex. A more advanced implementation would handle renegotiation.
            // For simplicity here, we'll just restart the local stream.
            // If in a call, this basic switch might disrupt it without renegotiation.
            startLocalStream();
            showMessage('Camera Switched', `Switched to ${!isFrontCamera ? 'front' : 'rear'} camera. If in a call, renegotiation might be needed.`);
        }
    };

    // --- Toggle Microphone ---
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
                showMessage('Microphone', track.enabled ? 'Unmuted' : 'Muted');
            });
        }
    };


    // --- Render UI ---
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>RN WebRTC Firebase Call</Text>

            {/* Local Video Stream */}
            {localStream && (
                <View style={styles.videoContainer}>
                    <Text style={styles.videoLabel}>Local Stream</Text>
                    <RTCView
                        streamURL={localStream.toURL()}
                        style={styles.localVideo}
                        objectFit={'cover'}
                        mirror={isFrontCamera} // Mirror if front camera
                    />
                </View>
            )}

            {/* Remote Video Stream */}
            {remoteStream && (
                <View style={styles.videoContainer}>
                    <Text style={styles.videoLabel}>Remote Stream</Text>
                    <RTCView
                        streamURL={remoteStream.toURL()}
                        style={styles.remoteVideo}
                        objectFit={'cover'}
                        mirror={true} // Often remote streams are mirrored for a natural feel
                    />
                </View>
            )}

            {/* Controls */}
            <View style={styles.controlsContainer}>
                {!remoteStream && !localStream && ( // Show only if not in call / stream not started
                    <TouchableOpacity style={styles.button} onPress={startLocalStream}>
                        <Text style={styles.buttonText}>Start My Camera</Text>
                    </TouchableOpacity>
                )}
                <TextInput
                    style={styles.input}
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChangeText={setRoomId}
                    editable={!remoteStream && !localStream} // Disable if in call
                />
                {!remoteStream ? ( // Show Create/Join only if not connected
                    <>
                        <TouchableOpacity style={[styles.button, styles.createButton]} onPress={createCall} disabled={!localStream || !roomId}>
                            <Text style={styles.buttonText}>Create Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.joinButton]} onPress={joinCall} disabled={!localStream || !roomId}>
                            <Text style={styles.buttonText}>Join Call</Text>
                        </TouchableOpacity>
                    </>
                ) : ( // Show Hang Up if connected
                    <TouchableOpacity style={[styles.button, styles.hangupButton]} onPress={hangUp}>
                        <Text style={styles.buttonText}>Hang Up</Text>
                    </TouchableOpacity>
                )}

                {localStream && ( // Show media controls if local stream is active
                    <View style={styles.mediaControls}>
                        <TouchableOpacity style={styles.smallButton} onPress={switchCamera}>
                            <Text style={styles.buttonText}>Switch Cam</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.smallButton} onPress={toggleMute}>
                            <Text style={styles.buttonText}>Mute/Unmute</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

// --- Styles ---
// Using Tailwind-like naming for clarity, but these are standard StyleSheet objects
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8', // Tailwind bg-slate-100
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    title: {
        fontSize: 24, // Tailwind text-2xl
        fontWeight: 'bold', // Tailwind font-bold
        marginVertical: 20, // Tailwind my-5
        color: '#1e293b', // Tailwind text-slate-800
    },
    videoContainer: {
        width: '90%',
        aspectRatio: 16 / 9, // Common video aspect ratio
        backgroundColor: '#e2e8f0', // Tailwind bg-slate-200
        borderRadius: 12, // Tailwind rounded-xl
        marginBottom: 15, // Tailwind mb-4
        overflow: 'hidden', // Ensure RTCView respects border radius
        borderWidth: 1,
        borderColor: '#cbd5e1', // Tailwind border-slate-300
    },
    videoLabel: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        zIndex: 1,
        fontSize: 12,
    },
    localVideo: {
        flex: 1,
    },
    remoteVideo: {
        flex: 1,
    },
    controlsContainer: {
        width: '90%',
        marginTop: 'auto', // Push controls to the bottom
        paddingBottom: 20, // Tailwind pb-5
    },
    input: {
        backgroundColor: 'white', // Tailwind bg-white
        paddingHorizontal: 15, // Tailwind px-4
        paddingVertical: 12, // Tailwind py-3
        borderRadius: 8, // Tailwind rounded-lg
        borderWidth: 1,
        borderColor: '#cbd5e1', // Tailwind border-slate-300
        marginBottom: 12, // Tailwind mb-3
        fontSize: 16, // Tailwind text-base
    },
    button: {
        paddingVertical: 12, // Tailwind py-3
        paddingHorizontal: 20, // Tailwind px-5
        borderRadius: 8, // Tailwind rounded-lg
        alignItems: 'center',
        marginBottom: 10, // Tailwind mb-2.5
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: 'white', // Tailwind text-white
        fontSize: 16, // Tailwind text-base
        fontWeight: '600', // Tailwind font-semibold
    },
    createButton: {
        backgroundColor: '#3b82f6', // Tailwind bg-blue-500
    },
    joinButton: {
        backgroundColor: '#10b981', // Tailwind bg-emerald-500
    },
    hangupButton: {
        backgroundColor: '#ef4444', // Tailwind bg-red-500
    },
    mediaControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10, // Tailwind mt-2.5
    },
    smallButton: {
        backgroundColor: '#64748b', // Tailwind bg-slate-500
        paddingVertical: 10, // Tailwind py-2.5
        paddingHorizontal: 15, // Tailwind px-4
        borderRadius: 8, // Tailwind rounded-lg
    },
});

export default App