import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot } from '@react-native-firebase/firestore';
import { WebRTCService } from '../services/WebRTCService';
import { RTCPeerConnection, mediaDevices, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';

const CallScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { callId, isCaller } = route.params;
  const [callStatus, setCallStatus] = useState('Initializing...');
  const webRTC = useRef(new WebRTCService()).current;

  useEffect(() => {
    let unsubOffer: any, unsubAnswer: any, unsubCallerCandidates: any, unsubCalleeCandidates: any;
    const db = getFirestore(getApp());
    const callDocRef = doc(collection(db, 'calls'), callId);

    const setup = async () => {
      await webRTC.init(false); // false = audio only

      // ICE candidate handling
      webRTC.onIceCandidate(async (candidate) => {
        const role = isCaller ? 'caller' : 'callee';
        const candidatesCol = collection(db, 'calls', callId, 'candidates', role, 'list');
        await setDoc(doc(candidatesCol), candidate.toJSON());
      });

      if (isCaller) {
        // Caller creates offer
        const offer = await webRTC.createOffer();
        await setDoc(callDocRef, { offer: offer.toJSON() }, { merge: true });
        setCallStatus('Calling...');

        // Listen for answer
        unsubAnswer = onSnapshot(callDocRef, async (docSnap) => {
          const data = docSnap.data();
          if (data?.answer) {
            await webRTC.setRemoteDescription(data.answer);
            setCallStatus('Connected');
          }
        });
      } else {
        // Callee listens for offer
        unsubOffer = onSnapshot(callDocRef, async (docSnap) => {
          const data = docSnap.data();
          if (data?.offer) {
            await webRTC.setRemoteDescription(data.offer);
            const answer = await webRTC.createAnswer();
            await setDoc(callDocRef, { answer: answer.toJSON() }, { merge: true });
            setCallStatus('Connected');
          }
        });
      }

      // Listen for ICE candidates
      unsubCallerCandidates = onSnapshot(collection(db, 'calls', callId, 'candidates', 'caller', 'list'), snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' && !isCaller) {
            const candidateData = change.doc.data();
            webRTC.addIceCandidate(new RTCIceCandidate(candidateData));
          }
        });
      });
      unsubCalleeCandidates = onSnapshot(collection(db, 'calls', callId, 'candidates', 'callee', 'list'), snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' && isCaller) {
            const candidateData = change.doc.data();
            webRTC.addIceCandidate(new RTCIceCandidate(candidateData));
          }
        });
      });
    };

    setup();

    return () => {
      unsubOffer && unsubOffer();
      unsubAnswer && unsubAnswer();
      unsubCallerCandidates && unsubCallerCandidates();
      unsubCalleeCandidates && unsubCalleeCandidates();
      webRTC.close();
    };
  }, [callId, isCaller, webRTC]);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{callStatus}</Text>
      <Button title="End Call" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  status: { fontSize: 18, marginBottom: 20 },
});

export default CallScreen;