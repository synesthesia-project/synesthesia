import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

export abstract class Component {

  public abstract getProtoInfo(idMap: IDMap): proto.Component;

}
