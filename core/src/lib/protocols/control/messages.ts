import { Message } from '../util/messages';

export interface ToggleRequest {
    request: 'toggle';
}

// TODO: investigate if this is used in composer over toggle(), and remove if needed
export interface PauseRequest {
    request: 'pause';
}

export interface GoToTimeRequest {
    request: 'go-to-time';
    positionMillis: number;
}

export interface PlaySpeedRequest {
    request: 'play-speed';
    /**
     * How fast should the song play compared to it's natural speed,
     * where 1 = normal, 2 = double speed, 0.5 = half speed
     */
    playSpeed: number;
}

/** Response for [[ToggleRequest]], [[PauseRequest]] or [[GoToTimeRequest]] */
export interface ControlResponse {
    success: boolean;
}

export type FileByPath = {
    type: 'path';
    path: string;
};

export type FileByMeta = {
    type: 'meta';
    title: string;
    artist?: string;
    album?: string;
    lengthMillis: number;
};

export type File = FileByPath | FileByMeta;

export type LayerState =
    {
        type: 'playing';
        effectiveStartTimeMillis: number;
        /**
         * How fast is the song playing compared to it's natural speed,
         * where 1 = normal, 2 = double speed, 0.5 = half speed
         */
        playSpeed: number;
    } | {
        type: 'paused';
        positionMillis: number;
    };

export type Layer = {
    file: File;
    state: LayerState;
};

export type PlayStateData = {
    layers: Layer[];
};

export type PlayState = {
    type: 'state';
    data: PlayStateData;
};

/** Request sent from the server to the controller */
export type ServerRequest = ToggleRequest | PauseRequest | GoToTimeRequest | PlaySpeedRequest;

/** Response sent from the controller to the server */
export type ControllerResponse = ControlResponse;

/** All Request types */
export type Request = ServerRequest;
/** All Response types */
export type Response = ControllerResponse;
/** All Response types */
export type Notification = PlayState;

export type ControlMessage = Message<Request, Response, Notification>;
