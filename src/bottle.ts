import type {
    AssertValidContainer,
    BottleLike,
    Dependencies,
    MergedContainer,
    Providers,
    ServiceName,
} from './types.ts';

/**
 * Given a Providers definition It builds an object that exposes a `container` property
 * where the services may be accessed and instantiated just-in-time.
 *
 * @example
 * ```ts
 * class Water {
 *   public origin = 'Antarctica'
 * }
 * class Barley {
 *   constructor(public water: Water) {}
 * }
 *
 * const providers = {
 *   barley: (container: { water: Water }) => new Barley(container.water),
 *   water: () => new Water(),
 * };
 * const bottle = new Bottle(providers);
 * console.log(bottle.container.barley.water.origin);
 * // Antarctica
 * console.log(bottle.container.barley.water === bottle.container.water);
 * // true
 * ```
 */
export class Bottle<
    T extends Providers,
    U extends BottleLike | undefined = undefined,
> implements BottleLike {
    protected _dependents: Map<
        ServiceName,
        Set<[ServiceName, BottleLike]>
    > = new Map<
        ServiceName,
        Set<[ServiceName, BottleLike]>
    >();
    protected _instances: Map<ServiceName, any> = new Map<ServiceName, any>();
    protected _tracking: Array<[ServiceName, BottleLike]> = [];

    public container: AssertValidContainer<
        MergedContainer<T, U>,
        Dependencies<T>
    > = new Proxy({} as typeof this.container, {
        deleteProperty: (_, serviceName: ServiceName) => {
            this.delete(serviceName);
            // In any case keep the behaviour of "delete" on plain objects (do not throw)
            return true;
        },
        get: (_, serviceName: ServiceName) => {
            // If the accessed service is NOT my own
            if (!this._isOwnService(serviceName)) {
                // Then It must be from an ancestor
                if (this._ancestor) {
                    return this._ancestor.container[serviceName];
                }
                // Otherwise this is an error
                throw new Error(`Unknown service "${String(serviceName)}"`);
            }
            // If the accessed service is my own,
            // and It has not been instantiated
            if (!this._instances.has(serviceName)) {
                // Let's keep track of other accessed services during the instantiation
                this._track(serviceName);
                // Proceed to instantiation
                this._instances.set(
                    serviceName,
                    this._providers[serviceName](this.container),
                );
                // And stop tracking what has been accessed during instantiation
                this._stopTrack();
            }
            // If there is an on-going instantiation
            if (this._tracking.length) {
                // The currently accessed service is a dependency of that on-going
                // instantiation. Take note that It depends on this one.
                const currentInstantiation =
                    this._tracking[this._tracking.length - 1];
                this._dependents.set(
                    serviceName,
                    (this._dependents.get(serviceName) ||
                        new Set<[ServiceName, Bottle<any, any>]>())
                        .add(currentInstantiation),
                );
            }
            // Finally return the accessed service instance
            return this._instances.get(serviceName);
        },
        getOwnPropertyDescriptor: (_, _serviceName: ServiceName) => {
            return { configurable: true, enumerable: true, writable: false };
        },
        has: (_, serviceName: ServiceName) => {
            // Either the accessed service is my own
            if (this._isOwnService(serviceName)) {
                return true;
            }
            // Or It must be from an ancestor
            if (this._ancestor) {
                return serviceName in this._ancestor.container;
            }
            // Or It does not exist
            return false;
        },
        ownKeys: (_) => {
            const keys = [...this._instances.keys()];
            if (this._ancestor) {
                keys.push(...Reflect.ownKeys(this._ancestor.container));
            }
            return keys;
        },
    });

    constructor(
        protected _providers: T,
        protected _ancestor?: U,
    ) {}

    /**
     * Reset a given provider by removing the existing instance.
     *
     * By default will reset any provider that depends on this one.
     * Pass `false` as the second parameter to limit the reset to
     * this specific service.
     *
     * Dependencies tracking is limited to accesses done during the
     * factory execution.
     */
    public delete(serviceName: ServiceName, deep = true): boolean {
        // If the deleted service is my own
        if (this._isOwnService(serviceName)) {
            // Then I'm the bottle that keeps track of the dependent services.
            if (deep) {
                // Let's delete any services that depends on this one.
                const dependentServices = this._dependents.get(serviceName);
                if (dependentServices) {
                    for (
                        const [dependentServiceName, bottleInstance]
                            of dependentServices
                    ) {
                        bottleInstance.delete(dependentServiceName);
                    }
                }
            }
            // And finally delete the target service
            return this._instances.delete(serviceName);
        }
        // If the deteled service is not mine, must be from an ancestor
        if (this._ancestor) {
            return this._ancestor.delete(serviceName, deep);
        }
        // Or otherwise it does not exist
        return false;
    }

    protected _isOwnService(serviceName: ServiceName): boolean {
        return serviceName in this._providers;
    }

    protected _track(
        serviceName: ServiceName,
        bottleInstance: BottleLike = this,
    ) {
        this._tracking.push([serviceName, bottleInstance]);
        if (this._ancestor) {
            // @ts-ignore: privileged access to private prop
            this._ancestor._track(serviceName, this);
        }
    }

    protected _stopTrack() {
        this._tracking.pop();
        if (this._ancestor) {
            // @ts-ignore: privileged access to private prop
            this._ancestor._stopTrack();
        }
    }
}
