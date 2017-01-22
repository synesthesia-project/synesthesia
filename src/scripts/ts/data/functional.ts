export interface Maybe<T> {
  case<Output>(none: () => Output, just: (value: T) => Output): Output;
}

class None<T> implements Maybe<T> {
  public case<Output>(none: () => Output, just: (value: T) => Output): Output {
    return none();
  }
}

class Just<T> implements Maybe<T> {

  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  public case<Output>(none: () => Output, just: (value: T) => Output): Output {
    return just(this.value);
  }
}

export function none<T>(): Maybe<T> {
  return new None();
}

export function just<T>(value: T): Maybe<T> {
  return new Just(value);
}
