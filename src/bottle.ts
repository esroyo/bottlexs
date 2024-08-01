import type {
    AssertValid,
    BottleLike,
    Dependencies,
    Providers,
    ServiceName,
    Simplify,
} from './types.ts';

export class Bottle<
    T extends Providers,
    U extends { container: any } | undefined = undefined,
> {
    protected _dependents: Map<
        ServiceName,
        Set<[ServiceName, Bottle<any, any> | undefined]>
    > = new Map<
        ServiceName,
        Set<[ServiceName, Bottle<any, any> | undefined]>
    >();
    protected _instances: Map<ServiceName, any> = new Map<ServiceName, any>();
    protected _tracking: Array<[ServiceName, Bottle<any, any> | undefined]> =
        [];

    public container: AssertValid<
        Simplify<BottleLike<T, U>['container']>,
        Dependencies<T>
    > = new Proxy({} as typeof this.container, {
        deleteProperty: (_, serviceName: ServiceName) => {
            // If the deteled service is my own
            if (serviceName in this._providers) {
                // Then I'm the bottle that keeps track of the dependent services.
                // Let's delete any services that depends on this one.
                const dependentServices = this._dependents.get(serviceName);
                if (dependentServices) {
                    for (
                        const [dependentServiceName, bottleInstance]
                            of dependentServices
                    ) {
                        delete (bottleInstance || this)
                            // @ts-ignore: the dependent service might be on another bottle though
                            .container[dependentServiceName];
                    }
                }
                // And finally delete the target service
                return this._instances.delete(serviceName);
            }
            // If the deteled service is not mine, must be from an ancestor
            if (this._ancestor) {
                return delete this._ancestor.container[serviceName];
            }
            // In any case keep the behaviour of "delete" on plain objects (do not throw)
            return true;
        },
        get: (_, serviceName: ServiceName) => {
            // If the accessed service is NOT my own
            if (!(serviceName in this._providers)) {
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
                        new Set<[ServiceName, Bottle<any, any> | undefined]>())
                        .add(currentInstantiation),
                );
            }
            // Finally return the accessed service instance
            return this._instances.get(serviceName);
        },
        getOwnPropertyDescriptor: (_, _prop: ServiceName) => {
            return { configurable: true, enumerable: true, writable: false };
        },
        has: (_, prop: ServiceName) => {
            // Either the accessed service is my own
            if (prop in this._providers) {
                return true;
            }
            // Or It must be from an ancestor
            if (this._ancestor) {
                return prop in this._ancestor.container;
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

    protected _track(prop: ServiceName, bottleInstance?: Bottle<any, any>) {
        this._tracking.push([prop, bottleInstance]);
        if (this._ancestor) {
            // @ts-ignore: privileged access to private prop
            this._ancestor._track(prop, this);
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
