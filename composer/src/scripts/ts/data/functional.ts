// Maybe

/**
 * TODO: deprecate (no longer needed with newer TypeScript)
 * @deprecated
 */
// export abstract class Maybe<T> {
//   public abstract caseOf<Output>(cases: {none: () => Output, just: (value: T) => Output}): Output;
//   public abstract fmap<Output>(map: (value: T) => Output): Maybe<Output>;

//   public isJust() {
//     return this.caseOf({
//       just: () => true,
//       none: () => false
//     });
//   }

//   public isNone() {
//     return !this.isJust();
//   }

//   public equals(b: Maybe<T>, equals: (a: T, b: T) => boolean) {
//     return this.caseOf({
//       just: a => b.caseOf({
//         just: b => equals(a, b),
//         none: () => false
//       }),
//       none: () => b.isNone()
//     });
//   }

//   public get(): T | null {
//     return this.caseOf({
//       just: value => value,
//       none: () => null
//     });
//   }
// }

// class None<T> extends Maybe<T> {
//   public caseOf<Output>(cases: {none: () => Output, just: (value: T) => Output}): Output {
//     return cases.none();
//   }

//   public fmap<Output>(): Maybe<Output> {
//     return none<Output>();
//   }
// }

// class Just<T> extends Maybe<T> {

//   private value: T;

//   constructor(value: T) {
//     super();
//     if (value === null || value === undefined) {
//       const err = new Error('value must not be null or undefined');
//       console.error(err);
//       throw err;
//     }
//     this.value = value;
//   }

//   public caseOf<Output>(cases: {none: () => Output, just: (value: T) => Output}): Output {
//     return cases.just(this.value);
//   }

//   public fmap<Output>(map: (value: T) => Output): Maybe<Output> {
//     return maybeFrom(map(this.value));
//   }
// }

// export function none<T>(): Maybe<T> {
//   return new None();
// }

// export function just<T>(value: T): Maybe<T> {
//   return new Just(value);
// }

// export function maybeFrom<T>(value: T | null | undefined): Maybe<T> {
//   return (value === null || value === undefined) ? none<T>() : just(value);
// }

// Either

export abstract class Either<L, R> {
  public abstract caseOf<Output>(cases: {
    left: (left: L) => Output;
    right: (right: R) => Output;
  }): Output;

  public equals(
    b: Either<L, R>,
    leftEquals: (a: L, b: L) => boolean,
    rightEquals: (a: R, b: R) => boolean
  ) {
    return this.caseOf({
      left: (a) =>
        b.caseOf({
          left: (b) => leftEquals(a, b),
          right: () => false,
        }),
      right: (a) =>
        b.caseOf({
          left: () => false,
          right: (b) => rightEquals(a, b),
        }),
    });
  }
}

class Left<L, R> extends Either<L, R> {
  private value: L;

  constructor(value: L) {
    super();
    this.value = value;
  }

  public caseOf<Output>(cases: {
    left: (left: L) => Output;
    right: (right: R) => Output;
  }): Output {
    return cases.left(this.value);
  }
}

class Right<L, R> extends Either<L, R> {
  private value: R;

  constructor(value: R) {
    super();
    this.value = value;
  }

  public caseOf<Output>(cases: {
    left: (left: L) => Output;
    right: (right: R) => Output;
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
