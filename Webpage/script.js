var FrameInterval = 40;

var playerCameras = new Map();

// =====================================
// 使用 Unity C# 呼叫

var position;
var rotation;
var isWalking;
var isJumping;

function gameData(p, r, w, j) {
    position = p;
    rotation = r;
    isWalking = w != 'False';
    isJumping = j != 'False';
}

function playerObject(playerUuid, screenPosX, screenPosY, screenPosZ, screenWidth, screenHeight) {
    if (!playerCameras.get(playerUuid)) return;
    const videoContainer = document.getElementById(playerCameras.get(playerUuid));
    videoContainer.style.opacity = (screenPosZ > 0.5) ? 1 : 0;
    videoContainer.style.left = (screenPosX / screenWidth) * 100 + "vw";
    videoContainer.style.bottom = ((screenPosY / screenHeight) * 100) + "vh";
    videoContainer.children[0].style.height = (40 / screenPosZ) + "vw";
}
// =====================================

const socket = io();

let localStream;
let pc; // RTCPeerConnection

async function startVideo() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

        // 測試用代碼
        // const video = document.createElement('video');
        // video.srcObject = localStream;
        // video.autoplay = true;
        // video.width = 800;
        // document.body.appendChild(video);

        // 創建 RTCPeerConnection
        pc = new RTCPeerConnection();

        // 將本地媒體流添加到 RTCPeerConnection
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        // 監聽 ICE 候選
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // 發送 ICE 候選到對方
                socket.emit('ice-candidate', { candidate: event.candidate.toJSON() });
            }
        };

        pc.ontrack = (event) => {
            for (const rv of document.getElementsByClassName("remoteVideo")) {
                if (rv.id == event.target.remoteDescription.sdp.split(" ")[1]) {
                    rv.remove();
                }
            }

            const div = document.createElement('div');
            div.classList.add("videoContainer");
            div.id = event.target.remoteDescription.sdp.split(" ")[1]

            const img = document.createElement('img');
            img.src = "./border.png";
            img.draggable = false;
            img.classList.add("videoBorder")

            const remoteVideo = document.createElement('video');
            remoteVideo.width = 800;
            remoteVideo.srcObject = event.streams[0];
            remoteVideo.autoplay = true;
            remoteVideo.classList.add("remoteVideo");
            document.body.appendChild(div);
            div.appendChild(remoteVideo);
            div.appendChild(img);

            remoteVideo.srcObject.oninactive = () => {
                remoteVideo.remove();
            }
        };


        // 創建 SDP 並設置為本地描述
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 發送 SDP 到對方
        socket.emit('sdp', { sdp: pc.localDescription });
    } catch (error) {
        console.error('Error accessing media devices:', error);
    }
}

socket.on('sdp', async (data) => {
    console.log(`連接到玩家攝影機 UUID: ${data.uuid} , CameraID: ${data.sdp.split(" ")[1]} `);
    playerCameras.set(data.uuid, data.sdp.split(" ")[1])
    try {
        // 設置遠端描述
        await pc.setRemoteDescription(data);

        // 如果是一個 offer，則回答之
        if (data.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // 發送回答 SDP 到對方
            socket.emit('sdp', { sdp: pc.localDescription });
        }
    } catch (error) {
        console.error('Error handling SDP:', error);
    }
});

socket.on('ice-candidate', async (data) => {
    try {
        if (data.candidate) {
            const iceCandidate = new RTCIceCandidate(data);
            // 將對方的 ICE 候選添加到 RTCPeerConnection
            await pc.addIceCandidate(iceCandidate);
        }
    } catch (error) {
        console.error('Error handling ICE candidate:', error);
    }
});

socket.on('connect', () => {
    console.log('伺服器連接成功');

    startVideo();

    setInterval(() => {
        if (position && rotation) {
            const animation = `(${isWalking ? '1' : '0'}, ${isJumping ? '1' : '0'})`
            socket.emit("player-data", JSON.stringify([position, rotation, animation]));
        }
    }, FrameInterval);
})

socket.on("player-data", async (data) => {
    if (UnityInstance) {
        UnityInstance.SendMessage('OtherPlayerLoader', 'PlayerData', data);
    }
});