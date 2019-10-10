/**
 * The control protocol is used for "sources" (such as music players or
 * mixing desks) to control a synesthesia server. (i.e. inform it what
 * music is playing, with timing information).
 *
 * The synesthesia server will then check to see if it knows what cue
 * file is associated with the currently playing song, and then use the
 * broadcast protocol to send the latest play state information downstream
 * to all of the consumers that are listening.
 *
 * The control protocol is designed to be a local protocol, i.e. the
 * controller software and the server should be running on the same
 * machine.
 */

export { ControllerEndpoint } from './controller';
export { ServerEndpoint } from './server';
