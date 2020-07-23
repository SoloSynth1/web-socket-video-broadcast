const peerConnections = {};
const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        },
        {
            urls: "turn:34.96.206.60:3478",
            username: "hkmci-rice-demo",
            credential: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        }
    ]
};

const socket = io.connect(window.location.origin);
const video = document.querySelector("video");

// Media constraints
const constraints = {
    video: { facingMode: "environment" }
    // Uncomment to enable audio
    // audio: true,
};

navigator.mediaDevices
    .getUserMedia(constraints).then(stream => {
        video.srcObject = stream;
        socket.emit("broadcaster");
}).catch(error => console.error(error));

socket.on("watcher", id => {
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    let stream = video.srcObject;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };

    peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("offer", id, peerConnection.localDescription);
        });
})

socket.on("answer", (id, description) => {
    peerConnections[id].setRemoteDescription(description);
});

socket.on("candidate", (id, candidate) => {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
    peerConnections[id].close();
    delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
    socket.close();
};