// Maybe

export abstract class Maybe<T> {
  public abstract caseOf<Output>(cases: {none: () => Output, just: (value: T) => Output}): Output;
  public abstract fmap<Output>(map: (value: T) => Output): Maybe<Output>;

  public isJust() {
    return this.caseOf({
      just: () => true,
      none: () => false
    });
  }

  public isNone() {
    return !this.isJust();
  }
}

class None<T> extends Maybe<T> {
  public caseOf<Output>(cases: {none: () => Output, just: (value: T) => Output}): Output {
    return cases.none();
  }

  public fmap<Output>(map: (value: T) => Output): Maybe<Output> {
    return none<Output>();
  }
}

class Just<T> extends Maybe<T> {

  private value: T;

  constructor(value: T) {
    super();
    if (value === null || value === undefined) {
      const err = new Error('value must not be null or undefined');
      console.error(err);
      throw err;
    }
    this.value = value;
  }

  public caseOf<Output>(cases: {none: () => Output, just: (value: T) => Output}): Output {
    return cases.just(this.value);
  }

  public fmap<Output>(map: (value: T) => Output): Maybe<Output> {
    return maybeFrom(map(this.value));
  }
}

export function none<T>(): Maybe<T> {
  return new None();
}

export function just<T>(value: T): Maybe<T> {
  return new Just(value);
}

export function maybeFrom<T>(value: T | null | undefined): Maybe<T> {
  return (value === null || value === undefined) ? none<T>() : just(value);
}

// Either

export interface Either<L, R> {
  caseOf<Output>(cases: {
    left: (left: L) => Output,
    right: (right: R) => Output
  }): Output;
}

class Left<L, R> implements Either<L, R> {

  private value: L;

  constructor(value: L) {
    this.value = value;
  }

  public caseOf<Output>(cases: {
    left: (left: L) => Output,
    right: (right: R) => Output
  }): Output {
    return cases.left(this.value);
  }
}

class Right<L, R> implements Either<L, R> {

  private value: R;

  constructor(value: R) {
    this.value = value;
  }

  public caseOf<Output>(cases: {
    left: (left: L) => Output,
    right: (right: R) => Output
  }): Output {
    return cases.right(this.value);
  }
}

export function left<L, R>(value: L): Either<L, R> {
  return new Left(value);
}

export function right<L, R>(value: R): Either<L, R> {
  return new Right(value);
}
