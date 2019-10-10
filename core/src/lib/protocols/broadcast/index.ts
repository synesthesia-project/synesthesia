/**
 * The broadcast protocol is used to communicate the synesthesia play state
 * and transfer any synesthesia cue files to composers that are listening.
 *
 * In the simplest case, this protocol is used to connect a synesthesia
 * server directly to consumers. (The server is, in turn, communicated to
 * by a controller with the controller protocol).
 *
 * The broadcast protocol is designed however to allow for multiple "hops"
 * between the server, and its consumers. Allowing for re-broadcasting by
 * nodes that act as proxies.
 */

import * as messages from './messages';
import {DownstreamEndpoint} from './downstream';
import {UpstreamEndpoint} from './upstream';

export { messages, DownstreamEndpoint, UpstreamEndpoint };
