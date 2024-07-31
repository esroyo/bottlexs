export type ConstructorParameters<T> = T extends new (...args: infer U) => any
    ? U
    : never;

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type UnionToIntersection<Union> = (
    // `extends unknown` is always going to be the case and is used to convert the
    // `Union` into a [distributive conditional
    // type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types).
    Union extends unknown
        // The union type is used as the only argument to a function since the union
        // of function arguments is an intersection.
        ? (distributedUnion: Union) => void
        // This won't happen.
        : never
    // Infer the `Intersection` type since TypeScript represents the positional
    // arguments of unions of functions as an intersection of the union.
) extends ((mergedIntersection: infer Intersection) => void) ? Intersection
    : never;

export type ServiceName = string | symbol;

export type Factory = (container: any) => any;

export type Providers = Record<ServiceName, Factory>;

export type Services<T extends Providers> = {
    [Key in keyof T]: ReturnType<T[Key]>;
};

export type Dependencies<T extends Providers> = UnionToIntersection<
    NonNullable<
        {
            [Key in keyof T]: Parameters<T[Key]>[0];
        }[keyof T]
    >
>;

export type AssertValid<Container, Deps> = Container extends Deps ? Container
    : never;

export type BottleLike<
    T extends Providers,
    U extends { container: any } | undefined = undefined,
> = U extends undefined ? { container: Services<T> }
    : U extends { container: any } ? { container: Services<T> } & U
    : never;