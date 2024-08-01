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
    protected _instances: Map<ServiceName, any> = new Map<ServiceName, any>();

    public container: AssertValid<
        Simplify<BottleLike<T, U>['container']>,
        Dependencies<T>
    > = new Proxy({} as typeof this.container, {
        get: (_, prop: ServiceName) => {
            if (!(prop in this._providers)) {
                if (this._ancestor) {
                    return this._ancestor.container[prop];
                }
                throw new Error(`Unknown service "${String(prop)}"`);
            }
            if (!this._instances.has(prop)) {
                this._instances.set(
                    prop,
                    this._providers[prop](this.container),
                );
            }
            return this._instances.get(prop);
        },
        getOwnPropertyDescriptor: (_, _prop: ServiceName) => {
            return { configurable: true, enumerable: true, writable: false };
        },
        has: (_, prop: ServiceName) => {
            if (prop in this._providers) {
                return true;
            }
            if (this._ancestor) {
                return prop in this._ancestor.container;
            }
            return false;
        },
        ownKeys: (_) => {
            const keys = [...this._instances.keys()];
            if (this._ancestor) {
                keys.push(...Reflect.ownKeys(this._ancestor.container));
            }
            return keys;
        }
    });

    constructor(
        protected _providers: T,
        protected _ancestor?: U,
    ) {}
}
