"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const universal_1 = require("id3-parser/lib/universal");
const control_1 = require("@synesthesia-project/core/lib/protocols/control");
const constants_1 = require("@synesthesia-project/core/lib/constants");
function loadAudioFile(audio, url) {
    return new Promise((resolve, reject) => {
        audio.src = url;
        audio.playbackRate = 1;
        const canPlay = () => {
            resolve();
            audio.removeEventListener('canplay', canPlay);
        };
        audio.addEventListener('canplay', canPlay);
    });
}
class Stage extends React.Component {
    constructor(props) {
        super(props);
        this.endpoint = null;
        this.audio = null;
        this.meta = null;
        this.state = {};
        this.loadAudioFile = this.loadAudioFile.bind(this);
        this.updateAudioRef = this.updateAudioRef.bind(this);
        this.updatePlayState = this.updatePlayState.bind(this);
    }
    getEndpoint() {
        if (!this.endpoint) {
            const endpointPromise = this.endpoint = new Promise((resolve, reject) => {
                const ws = new WebSocket(`ws://localhost:${constants_1.DEFAULT_SYNESTHESIA_PORT}/control`);
                const endpoint = new control_1.ControllerEndpoint(msg => ws.send(JSON.stringify(msg)));
                ws.addEventListener('open', () => {
                    endpoint.setRequestHandler((req) => __awaiter(this, void 0, void 0, function* () {
                        if (!this.audio)
                            return { success: false };
                        switch (req.request) {
                            case 'pause':
                                this.audio.pause();
                                return { success: true };
                            case 'toggle':
                                this.audio.paused ? this.audio.play() : this.audio.pause();
                                return { success: true };
                            case 'go-to-time':
                                this.audio.currentTime = req.positionMillis / 1000;
                                return { success: true };
                            case 'play-speed':
                                this.audio.playbackRate = req.playSpeed;
                                this.updatePlayState();
                                return { success: true };
                        }
                    }));
                    resolve(endpoint);
                });
                ws.addEventListener('error', err => {
                    if (endpointPromise === this.endpoint)
                        this.endpoint = null;
                    reject(err);
                });
                ws.addEventListener('close', err => {
                    if (endpointPromise === this.endpoint)
                        this.endpoint = null;
                });
                ws.addEventListener('message', msg => {
                    endpoint.recvMessage(JSON.parse(msg.data));
                });
            });
            this.endpoint.catch(err => {
                console.error(err);
                if (this.endpoint === endpointPromise) {
                    this.endpoint = null;
                }
            });
        }
        return this.endpoint;
    }
    loadAudioFile(ev) {
        if (!this.audio)
            return;
        const files = ev.target.files;
        if (files) {
            const file = files[0];
            const url = URL.createObjectURL(file);
            loadAudioFile(this.audio, url).then(() => {
                if (!this.audio)
                    return;
                universal_1.default(url).then(tag => {
                    if (tag.title) {
                        this.meta = {
                            title: tag.title,
                            artist: tag.artist,
                            album: tag.album
                        };
                        this.updatePlayState();
                    }
                });
            });
        }
        else {
            console.error('no files');
        }
        ev.target.value = '';
    }
    updatePlayState() {
        console.log(this.meta);
        this.getEndpoint().then(endpoint => {
            if (!this.meta || !this.audio)
                return;
            endpoint.sendState({ layers: [{
                        file: {
                            type: 'meta',
                            title: this.meta.title,
                            artist: this.meta.artist,
                            album: this.meta.album,
                            lengthMillis: this.audio.duration * 1000
                        },
                        state: this.audio.paused ? {
                            type: 'paused',
                            positionMillis: this.audio.currentTime * 1000
                        } : {
                            type: 'playing',
                            effectiveStartTimeMillis: performance.now() - this.audio.currentTime * 1000 / this.audio.playbackRate,
                            playSpeed: this.audio.playbackRate
                        }
                    }] });
        });
    }
    updateAudioRef(audio) {
        this.audio = audio;
        if (audio) {
            audio.addEventListener('playing', this.updatePlayState);
            audio.addEventListener('pause', this.updatePlayState);
            audio.addEventListener('seeked', this.updatePlayState);
        }
    }
    render() {
        return (React.createElement("div", null,
            React.createElement("input", { id: "file_picker", type: "file", onChange: this.loadAudioFile }),
            React.createElement("div", null,
                React.createElement("audio", { ref: this.updateAudioRef, controls: true }))));
    }
}
exports.Stage = Stage;
