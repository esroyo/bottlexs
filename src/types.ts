export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type Ctor = new (...args: any[]) => any;

export type CreateArray<
    Length extends number,
    Accumulator extends readonly any[] = readonly [],
    Item = any,
> = Accumulator['length'] extends Length ? Accumulator
    : CreateArray<Length, readonly [...Accumulator, Item]>;

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
 * Extract Service types inferred from the Factories return type.
 */
export type Services<T extends Providers> = {
    [Key in keyof T]: ReturnType<T[Key]>;
};

/**
 * Extract the declared first parameter from the Factories.
 * This first parameter represents the shape that each factory
 * expects from the Container. The intersection of all those
 * expectations is the Dependencies final type.
 */
export type Dependencies<T extends Providers> = UnionToIntersection<
    NonNullable<
        {
            [Key in keyof T]: Parameters<T[Key]>[0];
        }[keyof T]
    >
>;

/**
 * Given a Container, asserts that It can provide the shape required by Deps.
 * When the assertion can't be satisfied, returns `never` to block usage.
 */
export type AssertValidContainer<Container, Deps> = Container extends Deps
    ? Container
    : never;

/**
 * The minimal public interface for a Bottle like object.
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
 * Build the resulting merged shape of a Providers type,
 * plus another optional Bottle like type.
 */
export type MergedContainer<
    T extends Providers,
    U extends BottleLike | undefined = undefined,
> = Simplify<RawMergedContainer<T, U>>;

// type CreateRange<
//     Length extends number,
//     Accumulator extends any[] = [],
//     Item extends number = Decrement<Length>,
// > = Accumulator['length'] extends Length ? Accumulator
//     : CreateRange<Length, [Item, ...Accumulator], Decrement<Item>>;

type CreateRange<Length extends number> = Length extends 0 ? []
    : Length extends 1 ? [0]
    : Length extends 2 ? [0, 1]
    : Length extends 3 ? [0, 1, 2]
    : Length extends 4 ? [0, 1, 2, 3]
    : Length extends 5 ? [0, 1, 2, 3, 4]
    : Length extends 6 ? [0, 1, 2, 3, 4, 5]
    : Length extends 7 ? [0, 1, 2, 3, 4, 5, 6]
    : Length extends 8 ? [0, 1, 2, 3, 4, 5, 6, 7]
    : Length extends 9 ? [0, 1, 2, 3, 4, 5, 6, 7, 8]
    : Length extends 10 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    : Length extends 11 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    : Length extends 12 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : Length extends 13 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    : Length extends 14 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    : Length extends 15 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    : Length extends 16 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    : Length extends 17
        ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    : Length extends 18
        ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    : Length extends 19
        ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19]
    : never;

export type AsContainer<
    ParamTypes extends any[],
    ParamNames extends (readonly ServiceName[] | undefined),
> = ParamNames extends readonly ServiceName[] ? Simplify<
        {
            [
                Index in CreateRange<
                    ParamTypes['length']
                >[number] as ParamNames[Index]
            ]: ParamTypes[Index];
        }
    >
    : Record<ServiceName, any>;

export type ConstructorToFactory<
    T extends Ctor,
    U extends (readonly ServiceName[] | undefined),
> = T extends (new (...args: infer A) => infer K)
    ? ((container: AsContainer<A, U>) => K)
    : never;
