import type {
    CreateArray,
    ServiceFactory,
    ServiceFactoryToFactory,
    ServiceName,
} from './types.ts';

/**
 * Builds a Factory from the given ServiceFactory.
 *
 * The list of services must be constant to take advantage of type safety.
 *
 * When the returned Factory is invoked, the call to the original ServiceFactory
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
 *    hops: serviceFactory((water: Water) => new Hops(water), ['water'] as const),
 *    water: () => new Water(),
 * };
 * const bottle = new Bottle(providers);
 *
 * console.log(bottle.container.hops.water);
 * ```
 */
export const serviceFactory = <
    T extends ServiceFactory,
    U extends CreateArray<Parameters<T>['length'], [], ServiceName>,
>(serviceFactory: T, deps?: U): ServiceFactoryToFactory<T, U> => {
    return ((container: Record<ServiceName, any>) => {
        const args = ((deps || []) as ServiceName[])
            .map((depName) => container[depName]);
        return serviceFactory(...args);
    }) as unknown as ServiceFactoryToFactory<T, U>;
};
