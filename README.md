# Bottle XS 👕
[![JSR](https://jsr.io/badges/@esroyo/bottlexs)](https://jsr.io/@esroyo/bottlexs) [![JSR Score](https://jsr.io/badges/@esroyo/bottlexs/score)](https://jsr.io/@esroyo/bottlexs) [![codecov](https://codecov.io/gh/esroyo/bottlexs/graph/badge.svg?token=K4YA3R80FB)](https://codecov.io/gh/esroyo/bottlexs)

A dependency injection ~~micro~~ nano container that draws inspiration from [BottleJS](https://www.npmjs.com/package/bottlejs) (for concepts) and [Zod](https://www.npmjs.com/package/zod) (for type inference and composability).

## Features
* ✨ Type inference of the services just works
* ⚡ < 500 bytes (when minified, mangled and gzipped)
* 🍺 Terse lazy-loading access to the services as in BottleJS 
* 🏭 Supports (by default) the [service factory](https://www.npmjs.com/package/bottlejs#service-factory) pattern from BottleJS to define providers
* 🔧 Supports the [service](https://www.npmjs.com/package/bottlejs#injecting-dependencies) pattern from BottleJS via and additional pure helper (tree-shakeable)
* ♻️ Possiblity to reset the providers to re-instantiate a service
* 🐾 Tracks dependencies: reseting a provider will reset all the dependents (opt-out possible)
* 🔒 Favors immutability by taking the providers at construction time
* 🔌 Favors composability by inheriting from other containers

## Basic usage

```ts
class Water {}
class Barley {
    constructor(public water: Water) {}
}
class Hops {
    constructor(public water: Water) {}
}
class Beer {
    constructor(
        public name: string,
        public barley: Barley,
        public hops: Hops,
        public water: Water,
    ) {}
}

const someProviders = {
    barley: ({ water }: { water: Water }) => new Barley(water),
    // It is possible to use the alternative `service` helper
    // hops: ({ water }: { water: Water }) => new Hops(water),
    hops: service(Hops, ['water'] as const),
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
    ) => new Beer('San Miguel', barley, hops, water),
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

console.log(otherBottle.container.beer.name);
// "San Miguel"

console.log(
    someBottle.container.water ===
        otherBottle.container.beer.water,
);
// true
```
