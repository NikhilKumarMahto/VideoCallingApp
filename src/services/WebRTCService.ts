import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    mediaDevices,
} from 'react-native-webrtc';
import database from '@react-native-firebase/database';

export class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: any = null;
    private remoteStream: any = null;
    private roomId: string | null = null;

    constructor() {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302',
                    ],
                },
            ],
        });
    }

    public async startCall(roomId: string): Promise<void> {
        try {
            this.roomId = roomId;
            await this.setupLocalStream();
            await this.createOffer();
            this.setupListeners();
        } catch (error) {
            console.error('Error starting call:', error);
            throw error;
        }
    }

    public async joinCall(roomId: string): Promise<void> {
        try {
            this.roomId = roomId;
            await this.setupLocalStream();
            await this.setupRemoteDescription();
            await this.createAnswer();
            this.setupListeners();
        } catch (error) {
            console.error('Error joining call:', error);
            throw error;
        }
    }

    private async setupLocalStream(): Promise<void> {
        const stream = await mediaDevices.getUserMedia({
            audio: true,
            video: false, // Initially false for audio-only calls
        });
        this.localStream = stream;
        stream.getTracks().forEach((track) => {
            this.peerConnection?.addTrack(track, stream);
        });
    }

    private async createOffer(): Promise<void> {
        try {
            const offer = await this.peerConnection?.createOffer();
            await this.peerConnection?.setLocalDescription(offer);

            // Save the offer to Firebase
            await database()
                .ref(`rooms/${this.roomId}/offer`)
                .set(JSON.stringify(offer));
        } catch (error) {
            console.error('Error creating offer:', error);
            throw error;
        }
    }

    private async createAnswer(): Promise<void> {
        try {
            const answer = await this.peerConnection?.createAnswer();
            await this.peerConnection?.setLocalDescription(answer);

            // Save the answer to Firebase
            await database()
                .ref(`rooms/${this.roomId}/answer`)
                .set(JSON.stringify(answer));
        } catch (error) {
            console.error('Error creating answer:', error);
            throw error;
        }
    }

    private setupListeners(): void {
        // Handle ICE candidates
        this.peerConnection!.onicecandidate = ({ candidate }) => {
            if (candidate) {
                database()
                    .ref(`rooms/${this.roomId}/candidates`)
                    .push(JSON.stringify(candidate));
            }
        };

        // Handle remote stream
        this.peerConnection!.ontrack = (event) => {
            this.remoteStream = event.streams[0];
        };

        // Listen for remote candidates
        database()
            .ref(`rooms/${this.roomId}/candidates`)
            .on('child_added', (snapshot) => {
                const candidate = JSON.parse(snapshot.val());
                this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
            });
    }

    private async setupRemoteDescription(): Promise<void> {
        const offerSnapshot = await database()
            .ref(`rooms/${this.roomId}/offer`)
            .once('value');
        const offer = JSON.parse(offerSnapshot.val());
        await this.peerConnection?.setRemoteDescription(
            new RTCSessionDescription(offer)
        );
    }

    public endCall(): void {
        this.localStream?.getTracks().forEach((track: any) => track.stop());
        this.peerConnection?.close();
        if (this.roomId) {
            database().ref(`rooms/${this.roomId}`).remove();
        }
    }

    public toggleAudio(enabled: boolean): void {
        this.localStream?.getAudioTracks().forEach((track: any) => {
            track.enabled = enabled;
        });
    }
}