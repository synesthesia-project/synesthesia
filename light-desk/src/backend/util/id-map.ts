export class IDMap {

  private readonly idMap = new WeakMap<any, number>();
  private nextId = 0;

  public getId(object: any): number {
    let i = this.idMap.get(object);
    if (i === undefined) {
      i = this.nextId ++;
      this.idMap.set(object, i);
    }
    return i;
  }
}
