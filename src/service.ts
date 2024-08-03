import type {
    ConstructorToFactory,
    CreateArray,
    Ctor,
    ServiceName,
} from './types.ts';

/**
 * Builds a Factory for the given Constructor.
 *
 * The list of services should be read-only constant for type safety.
 *
 * When the returned Factory is invoked, the call to [[Construct]]
 * will receive the resolved services as arguments (ordered).
 *
 * @example
 * ```ts
 * class Water {}
 * class Hops {
 *    constructor(public water: Water) {}
 * }
 *
 * const providers = {
 *    // Note the array is declared as const
 *    hops: service(Hops, ['water'] as const),
 *    water: () => new Water(),
 * };
 * const bottle = new Bottle(providers);
 *
 * console.log(bottle.container.hops.water);
 * ```
 */
export const service = <
    T extends Ctor,
    U extends CreateArray<ConstructorParameters<T>['length'], [], ServiceName>,
>(ctor: T, deps?: U): ConstructorToFactory<T, U> => {
    return ((container: Record<ServiceName, any>) => {
        const args = ((deps || []) as ServiceName[])
            .map((depName) => container[depName]);
        return new ctor(...args);
    }) as unknown as ConstructorToFactory<T, U>;
};
