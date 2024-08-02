type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

type UnionToIntersection<Union> = (
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

/** Types that can be used as a Service name */
export type ServiceName = string | symbol;

/** Basic shape of a Factory function */
export type Factory = (container: any) => any;

/** A collection of Factories indexed by Service name */
export type Providers = Record<ServiceName, Factory>;

/**
 * Extract Service types inferred from the Factories retun type.
 */
export type Services<T extends Providers> = {
    [Key in keyof T]: ReturnType<T[Key]>;
};

/**
 * Extract the declared first parameter from the Factories,
 * which represents the shape each factory expects from the Container.
 */
export type Dependencies<T extends Providers> = UnionToIntersection<
    NonNullable<
        {
            [Key in keyof T]: Parameters<T[Key]>[0];
        }[keyof T]
    >
>;

/**
 * Given a Container asserts that it is valid to fullfill the shape of the Deps.
 * When the assertion can't be satisfied returns never, to make the result unusable.
 */
export type AssertValidContainer<Container, Deps> = Container extends Deps
    ? Container
    : never;

/**
 * The minimal public interface of a Bottle like object.
 */
export type BottleLike<Container = any> = {
    container: Container;
    delete(serviceName: ServiceName, deep?: boolean): boolean;
};

type RawMergedContainer<
    T extends Providers,
    U extends BottleLike | undefined = undefined,
> = U extends undefined ? Services<T>
    : U extends BottleLike ? Services<T> & U['container']
    : never;

/**
 * Build the resulting merged shape of the given Providers type
 * plus an another optional Bottle like type.
 */
export type MergedContainer<
    T extends Providers,
    U extends BottleLike | undefined = undefined,
> = Simplify<RawMergedContainer<T, U>>;
