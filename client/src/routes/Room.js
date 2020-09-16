import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 40%;
    width: 50%;
    transform: scaleX(-1);
    -webkit-transform: scaleX(-1);
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    // eslint-disable-next-line
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} />
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
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    
    useEffect(() => {
        socketRef.current = io.connect("https://learnage-server.precisely.co.in:4000");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                console.log('Connected to Precisely | ' + users.length + ' user(s) in the room');
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push({
                        peerId: userID,
                        peer
                    });

                })
                setPeers(peers);
            })

            socketRef.current.on("user joined", payload => {
                console.log("Incoming signal from " + payload.callerID);
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })
                setPeers(users => [...users, {peerId: payload.callerID, peer} ]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("disconnected", userId => {
                console.log(userId + "has left");
                removePeer(userId)
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
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        // peer.on('close', () => {
        //     removePeer(userToSignal)
        // })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            console.log("returning signal to " + callerID);
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.on('error', (err) => {
            removePeer(callerID)
        })

        peer.signal(incomingSignal);

        return peer;
    }

    function removePeer(id){
        console.log("removing " + id);
        setPeers((prev) => {
            return prev.filter(e => e.peerId !== id);
        });

        let newPeerRef = peersRef.current.filter(e => e.peerID !== id);
        peersRef.current = newPeerRef;
    }

    return (
        <>
        <button>Exit</button>
        <Container>
            <StyledVideo muted ref={userVideo} autoPlay playsInline />
            {peers.map((peer, index) => {
                return (
                    <Video key={index} peer={peer.peer} />
                );
            })}
        </Container>
        </>
    );
};

export default Room;
