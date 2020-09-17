import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

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
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;

    useEffect(() => {
        socketRef.current = io.connect("http://localhost:4000/videoCall");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", roomID);

            socketRef.current.on("all users", users => {
                console.log('Connected to KD Server | ' + users.length + ' user(s) in the room');
                userVideo.current.id = socketRef.current.id;
                const peers = [];
                users.forEach(userID => {
                    console.log(userID)
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
                setPeers(users => [...users, { peerId: payload.callerID, peer }]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("user left", userId => {
                console.log(userId + "has left");
                let v = document.getElementById(userId);
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
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        // peer.on('error', (err) => {
        //     removePeer(callerID)
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

        // peer.on('error', (err) => {
        //     removePeer(callerID)
        // })

        peer.signal(incomingSignal);

        return peer;
    }

    // function removePeer(id) {
    //     console.log("removing " + id);
    //     setPeers((prev) => {
    //         return prev.filter(e => e.peerId !== id);
    //     });

    //     let newPeerRef = peersRef.current.filter(e => e.peerID !== id);
    //     peersRef.current = newPeerRef;

    //     let v = document.getElementById(id);
    //     if (v) {
    //         v.remove()
    //     }
    // }

    return (
        <Container>
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
