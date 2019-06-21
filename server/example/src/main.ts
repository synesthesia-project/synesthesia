import {ControllerEndpoint} from '@synesthesia-project/core/protocols/control';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/constants';

const ws = new WebSocket(`ws://localhost:${DEFAULT_SYNESTHESIA_PORT}/control`);

ws.addEventListener('open', () => {
    // Start controller
    const endpoint = new ControllerEndpoint(msg => ws.send(JSON.stringify(msg)));
    endpoint.sendState({
        layers: []
    });
});
