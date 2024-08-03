# Bottle XS 👕
[![JSR](https://jsr.io/badges/@esroyo/bottlexs)](https://jsr.io/@esroyo/bottlexs) [![JSR Score](https://jsr.io/badges/@esroyo/bottlexs/score)](https://jsr.io/@esroyo/bottlexs) [![codecov](https://codecov.io/gh/esroyo/bottlexs/graph/badge.svg?token=K4YA3R80FB)](https://codecov.io/gh/esroyo/bottlexs)

A dependency injection ~~micro~~ nano container that draws inspiration from [BottleJS](https://www.npmjs.com/package/bottlejs) (for concepts) and [Zod](https://www.npmjs.com/package/zod) (for type inference and composability).

## Features
* ✨ Type inference of the services just works
* ⚡ < 500 bytes (when minified and gzipped)
* 🍺 Terse lazy-loading access to the services as in [BottleJS](https://www.npmjs.com/package/bottlejs#simple-example)
* 🏭 Supports (by default) the [factory](https://www.npmjs.com/package/bottlejs#factoryname-factory) pattern from BottleJS
* 🔧 Supports the [service](https://www.npmjs.com/package/bottlejs#servicename-constructor--dependency--) and [serviceFactory](https://www.npmjs.com/package/bottlejs#servicefactoryname-factoryservice--dependency--) patterns from BottleJS via additional pure helpers (tree-shakeable)
* ♻️ Possiblity to reset the providers to re-instantiate a service
* 🐾 Tracks dependencies: reseting a provider will reset all the dependents (opt-out possible)
* 🔒 Favors immutability by taking the providers at construction time
* 🔌 Favors composability by inheriting from other containers

## Examples

### Basic usage

```ts
import { Bottle } from 'jsr:@esroyo/bottlexs';

interface BarleyLike {
    water: Water;
}

interface HopsLike {
    water: Water;
}

class Water {}
class Nordal implements BarleyLike {
    constructor(public water: Water) {}
}
class Hallertau implements HopsLike {
    constructor(public water: Water) {}
}
class Beer {
    public brand = 'San Miguel';
    constructor(
        public barley: BarleyLike,
        public hops: HopsLike,
        public water: Water,
    ) {}
}

// Services are defined with a name `string | symbol` and a `Factory` function.
// A factory function receives an object as an argument (the container), and
// should return the constructed service.
//
// The accurate typing of the object expected by each Factory is important.
// The Factory declaration is used to typecheck that all expected dependencies
// are effectively available at the end of the day.
const providers = {
    barley: (container: { water: Water }) => new Nordal(container.water),
    hops: (container: { water: Water }) => new Hallertau(container.water),
    water: () => new Water(),
    beer: (
        container: { barley: BarleyLike; hops: HopsLike; water: Water },
    ) => new Beer(container.barley, container.hops, container.water),
};
const bottle = new Bottle(providers);

// inferred type
type Services = typeof bottle.container;
// type SomeServices = {
//     barley: Nordal;
//     hops: Hallertau;
//     water: Water;
//     beer: Beer;
// }

console.log(bottle.container.beer.brand);
// "San Miguel"

console.log(
    bottle.container.water ===
        bottle.container.beer.water,
);
// true
```

### Inherit/compose in multiple bottle instances

```ts
import { Bottle } from 'jsr:@esroyo/bottlexs';

class Water {}
class Barley {
    constructor(public water: Water) {}
}
class Hops {
    constructor(public water: Water) {}
}
class Beer {
    public brand = 'San Miguel';
    constructor(
        public barley: Barley,
        public hops: Hops,
        public water: Water,
    ) {}
}

const someProviders = {
    barley: ({ water }: { water: Water }) => new Barley(water),
    hops: ({ water }: { water: Water }) => new Hops(water),
    water: () => new Water(),
};
const someBottle = new Bottle(someProviders);

// inferred type
type SomeServices = typeof someBottle.container;
// type SomeServices = {
//     barley: Barley;
//     hops: Hops;
//     water: Water;
// }

const someOtherProviders = {
    now: () => Date.now,
    beer: (
        { barley, hops, water }: { barley: Barley; hops: Hops; water: Water },
    ) => new Beer(barley, hops, water),
};
const otherBottle = new Bottle(someOtherProviders, someBottle);

// inferred type
type OtherServices = typeof otherBottle.container;
// type OtherServices = {
//     now: () => number;
//     beer: Beer;
//     barley: Barley;
//     hops: Hops;
//     water: Water;
// }

console.log(otherBottle.container.beer.brand);
// "San Miguel"

console.log(
    someBottle.container.water ===
        otherBottle.container.beer.water,
);
// true
```

### Use the `service` helper with constructors

```ts
import { Bottle, service } from 'jsr:@esroyo/bottlexs';

class Water {}
class Barley {
    constructor(public water: Water) {}
}
class Hops {
    constructor(public water: Water) {}
}

const providers = {
    // The default provider pattern is the Factory pattern:
    // receives the container as parameter and returns an instance
    barley: (container: { water: Water }) => new Barley(container.water),
    water: () => new Water(),
    // It is possible to use the alternative `service` helper:
    // takes in a Constructor, and a list of services to be resolved
    // and passed as arguments to the [[Constructor]] call
    hops: service(Hops, ['water'] as const),
};
const bottle = new Bottle(providers);

// inferred type
type Services = typeof bottle.container;
// type SomeServices = {
//     barley: Barley;
//     hops: Hops;
//     water: Water;
// }

```
