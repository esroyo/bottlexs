import { Bottle } from './src/bottle.ts';

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

console.log(someBottle.container.water === otherBottle.container.beer.water);
// true
