import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

let SOCKET_SERVER;
if(process.env.REACT_APP_SERVER){
    SOCKET_SERVER = process.env.REACT_APP_SERVER;
} else {
    SOCKET_SERVER = "https://learnage-server.precisely.co.in:4000/videoCall";
}

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    height: 100vh;
    width: 100%;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
`;

const Video = (props) => {
    const ref = useRef();
    useEffect(() => {
        props.peer.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
        // eslint-disable-next-line
    }, []);

    return (
        <video playsInline autoPlay ref={ref} id={props.peer.peerId} className="styledVideo" />
    );
}

const videoConstraints = {
    height: window.innerHeight / 4,
    width: window.innerWidth / 4
};

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const userStream = useRef();
    const userCameraMedia = useRef();
    const [sharingScreen,togglesharing] = useState(false);
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    const currPhoneixID = 'ankldjfanfnacnald';

    useEffect(() => {
        socketRef.current = io.connect(SOCKET_SERVER);
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userStream.current = stream;
            userVideo.current.srcObject = userStream.current;

            socketRef.current.emit("join room", {phoneixID: currPhoneixID, roomID: roomID});

            socketRef.current.on("all users", users => {
                console.log('Connected to KD Server | ' + users.length + ' user(s) in the room');
                userVideo.current.id = socketRef.current.id;
                const peers = [];
                users.forEach(payload => {
                    const userID = payload.socketID;
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        phoneixID: payload.phoneixID,
                        peer,
                    })
                    peers.push({
                        peerId: userID,
                        phoneixID: payload.phoneixID,
                        peer
                    });

                })
                setPeers(peers);
            })

            socketRef.current.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    phoneixID: payload.phoneixID,
                    peer,
                })
                setPeers(users => [...users, { peerId: payload.callerID,phoneixID: payload.phoneixID, peer }]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("mute", payload => {
                console.log(payload);
            })

            socketRef.current.on("user left", socketID => {
                console.log(socketID + "has left");
                let v = document.getElementById(socketID);
                if (v) {
                    v.remove()
                }
            })

        })

        // eslint-disable-next-line
    }, []);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal, currPhoneixID })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    function shareScreen(){
        userCameraMedia.current= userStream.current;

        navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
            // Get Video stream of screen share
            const screenStream = stream.getTracks()[0];
            // Set Screen share stream to video el
            userVideo.current.srcObject = stream;
            togglesharing(true);

            // Send screen share to each peer
            peers.forEach(({peer}) => {
                // Old Stream that was previously being sent
                const oldStream = peer.streams[0].getVideoTracks()[0];
                // Replace camera stream with screen stream
                peer.replaceTrack(oldStream, screenStream, peer.streams[0]);
            });
            
            // Revert to camera screen when screen stream is stoppped
            screenStream.onended = function(){
                togglesharing(false);
                console.log('Stopping screen sharing')
                peers.forEach(({peer}) => {
                // Get the old stream
                const oldStream = peer.streams[0].getVideoTracks()[0];
                // Set Camera stream
                const newStream = userCameraMedia.current.getTracks().find(s => s.kind === 'video');
                // Replace the stream on peer
                peer.replaceTrack(oldStream, newStream, peer.streams[0]);
                // Set camera stream on local video el
                userVideo.current.srcObject = userCameraMedia.current;
                });
            }

        });
    }

    return (
        <Container>
            {!sharingScreen && <button id="screen-btn" onClick={() => shareScreen()}>Toogle Screen Share</button>}
            <video muted ref={userVideo} playsInline autoPlay className="styledVideo" />
            {peers.map((peer, index) => {
                return (
                    <Video key={index} peer={peer} />
                );
            })}
        </Container>
    );
};

export default Room;
