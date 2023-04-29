export class IDMap {
  private readonly idMap = new WeakMap<object, number>();
  private nextId = 0;

  public getId(object: object): number {
    let i = this.idMap.get(object);
    if (i === undefined) {
      i = this.nextId++;
      this.idMap.set(object, i);
    }
    return i;
  }
}
