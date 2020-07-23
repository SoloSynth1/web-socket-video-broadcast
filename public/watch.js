let peerConnection;
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
}

const socket = io.connect(window.location.origin);
const video = document.querySelector("video");

socket.on("offer", (id, description) => {
    peerConnection = new RTCPeerConnection(config);
    peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
           socket.emit("answer", id, peerConnection.localDescription);
        });
    peerConnection.ontrack = event => {
        video.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };
})

socket.on("candidate", (id, candidate) => {
    peerConnection
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
});

socket.on("connect", () => {
    socket.emit("watcher");
});

socket.on("broadcaster", () => {
    socket.emit("watcher");
});

socket.on("disconnectPeer", () => {
    peerConnection.close()
});

window.onunload = window.onbeforeunload = () => {
    socket.close();
};