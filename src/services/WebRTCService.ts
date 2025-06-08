import { getApp } from '@react-native-firebase/app';
import { getDatabase } from '@react-native-firebase/database';
import {
  RTCPeerConnection,
  mediaDevices,
  RTCSessionDescription,
  RTCIceCandidate,
} from 'react-native-webrtc';

const configuration = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};

export class WebRTCService {
  peer: RTCPeerConnection | null = null;
  localStream: any = null;
  remoteStream: any = null;
  db = getDatabase(getApp());

  async init(isVideo: boolean = false) {
    this.peer = new RTCPeerConnection(configuration);
    this.localStream = await mediaDevices.getUserMedia({
      audio: true,
      video: isVideo,
    });
    this.peer.addStream(this.localStream);

    this.remoteStream = null;
    this.peer.onaddstream = event => {
      this.remoteStream = event.stream;
    };
    return this.localStream;
  }

  async createOffer() {
    if (!this.peer) throw new Error('PeerConnection not initialized');
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async createAnswer() {
    if (!this.peer) throw new Error('PeerConnection not initialized');
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(desc: RTCSessionDescription) {
    if (!this.peer) throw new Error('PeerConnection not initialized');
    await this.peer.setRemoteDescription(new RTCSessionDescription(desc));
  }

  async addIceCandidate(candidate: RTCIceCandidate) {
    if (!this.peer) throw new Error('PeerConnection not initialized');
    await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    if (!this.peer) throw new Error('PeerConnection not initialized');
    this.peer.onicecandidate = event => {
      if (event.candidate) callback(event.candidate);
    };
  }

  close() {
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
    if (this.localStream) {
      this.localStream.release();
      this.localStream = null;
    }
    this.remoteStream = null;
  }
}
