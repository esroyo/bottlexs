import {
    assertEquals,
    assertSpyCalls,
    assertThrows,
    spy,
} from '../dev_deps.ts';
import { Bottle } from './bottle.ts';

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

Deno.test('Bottle (standalone)', async (t) => {
    const providers = {
        barley: spy(({ water }: { water: Water }) => new Barley(water)),
        hops: spy(({ water }: { water: Water }) => new Hops(water)),
        beer: spy((
            { barley, hops, water }: {
                barley: Barley;
                hops: Hops;
                water: Water;
            },
        ) => new Beer('San Miguel', barley, hops, water)),
        water: spy(() => new Water()),
        now: spy(() => Date.now),
    };
    const bottle = new Bottle(providers);

    await t.step(
        'should respond to "in" operator without triggering instantiation nor throwing',
        async () => {
            assertEquals('beer' in bottle.container, true);
            assertSpyCalls(providers.beer, 0);
            // will not throw
            assertEquals('malt' in bottle.container, false);
        },
    );

    await t.step(
        'should respond to [[OwnPropertyKeys]] operations with instantiated services (does not trigger instantiation)',
        async () => {
            assertEquals(Object.keys(bottle.container), []);
            assertEquals(Object.keys({ ...bottle.container }).length, 0);

            assertEquals(bottle.container.water instanceof Water, true);
            assertSpyCalls(providers.water, 1);

            assertEquals(Object.keys(bottle.container), ['water']);
            assertEquals(Object.keys({ ...bottle.container }).length, 1);
        },
    );

    await t.step('should throw if an unknown service is accessed', async () => {
        assertThrows(() => {
            // @ts-expect-error
            bottle.container.malt;
        });
    });

    await t.step('should invoke the factory on access time', async () => {
        assertSpyCalls(providers.beer, 0);
        assertEquals(bottle.container.beer.name, 'San Miguel');
        assertSpyCalls(providers.beer, 1);
    });

    await t.step('should only invoke once the same factory', async () => {
        assertEquals(bottle.container.beer.name, 'San Miguel');
        assertSpyCalls(providers.beer, 1);

        assertEquals(bottle.container.beer.water, bottle.container.water);
        assertEquals(bottle.container.beer.barley, bottle.container.barley);
        assertEquals(bottle.container.beer.hops, bottle.container.hops);
        assertEquals(bottle.container.barley.water, bottle.container.water);
        assertEquals(bottle.container.hops.water, bottle.container.water);

        assertSpyCalls(providers.barley, 1);
        assertSpyCalls(providers.hops, 1);
        assertSpyCalls(providers.water, 1);
    });

    await t.step(
        'should be able to remove an instance with the [[Delete]] operation',
        async () => {
            assertSpyCalls(providers.water, 1);
            assertSpyCalls(providers.barley, 1);
            assertSpyCalls(providers.hops, 1);
            assertSpyCalls(providers.beer, 1);

            // @ts-ignore: does not really need to be declared as optional
            assertEquals(delete bottle.container.hops, true);

            assertEquals(bottle.container.beer instanceof Beer, true);
            assertSpyCalls(providers.water, 1);
            assertSpyCalls(providers.barley, 1);
            assertSpyCalls(providers.beer, 2);
            assertSpyCalls(providers.hops, 2);
        },
    );

    await t.step(
        'should not throw if [[Delete]] is performed over a non-existant service ',
        async () => {
            // @ts-ignore: does not really need to be declared as optional
            assertEquals(delete bottle.container.malt, true);
        },
    );

    await t.step(
        'should never call the factory of an unaccessed service',
        async () => {
            assertSpyCalls(providers.now, 0);
        },
    );

    await t.step(
        'should be able to remove an instance without reseting the dependents',
        async () => {
            assertSpyCalls(providers.water, 1);
            assertSpyCalls(providers.barley, 1);
            assertSpyCalls(providers.hops, 2);
            assertSpyCalls(providers.beer, 2);

            assertEquals(bottle.delete('hops', false), true);

            assertEquals(bottle.container.hops instanceof Hops, true);
            assertSpyCalls(providers.water, 1);
            assertSpyCalls(providers.barley, 1);
            assertSpyCalls(providers.beer, 2);
            assertSpyCalls(providers.hops, 3);
        },
    );
});

Deno.test('Bottle (with an standalone ancestor)', async (t) => {
    const ancestorProviders = {
        barley: spy(({ water }: { water: Water }) => new Barley(water)),
        hops: spy(({ water }: { water: Water }) => new Hops(water)),
        water: spy(() => new Water()),
        now: spy(() => Date.now),
    };
    const ancestor = new Bottle(ancestorProviders);

    const providers = {
        beer: spy((
            { barley, hops, water }: {
                barley: Barley;
                hops: Hops;
                water: Water;
            },
        ) => new Beer('San Miguel', barley, hops, water)),
    };
    const bottle = new Bottle(providers, ancestor);

    await t.step(
        'should respond to "in" operator without triggering instantiation nor throwing',
        async () => {
            assertEquals('beer' in bottle.container, true);
            assertSpyCalls(providers.beer, 0);
            // will not throw
            assertEquals('malt' in bottle.container, false);
        },
    );

    await t.step(
        'should respond to [[OwnPropertyKeys]] operations with instantiated services (does not trigger instantiation)',
        async () => {
            assertEquals(Object.keys(bottle.container), []);
            assertEquals(Object.keys({ ...bottle.container }).length, 0);

            assertEquals(bottle.container.water instanceof Water, true);
            assertSpyCalls(ancestorProviders.water, 1);

            assertEquals(Object.keys(bottle.container), ['water']);
            assertEquals(Object.keys({ ...bottle.container }).length, 1);
        },
    );

    await t.step('should throw if an unknown service is accessed', async () => {
        assertThrows(() => {
            // @ts-expect-error
            bottle.container.malt;
        });
    });

    await t.step('should invoke the factory on access time', async () => {
        assertSpyCalls(providers.beer, 0);
        assertEquals(bottle.container.beer.name, 'San Miguel');
        assertSpyCalls(providers.beer, 1);
    });

    await t.step('should only invoke once the same factory', async () => {
        assertEquals(bottle.container.beer.name, 'San Miguel');
        assertSpyCalls(providers.beer, 1);

        assertEquals(bottle.container.beer.water, bottle.container.water);
        assertEquals(bottle.container.beer.barley, bottle.container.barley);
        assertEquals(bottle.container.beer.hops, bottle.container.hops);
        assertEquals(bottle.container.barley.water, bottle.container.water);
        assertEquals(bottle.container.hops.water, bottle.container.water);

        assertSpyCalls(ancestorProviders.barley, 1);
        assertSpyCalls(ancestorProviders.hops, 1);
        assertSpyCalls(ancestorProviders.water, 1);
    });

    await t.step(
        'should be able to remove an instance with the [[Delete]] operation',
        async () => {
            assertSpyCalls(ancestorProviders.water, 1);
            assertSpyCalls(ancestorProviders.barley, 1);
            assertSpyCalls(ancestorProviders.hops, 1);
            assertSpyCalls(providers.beer, 1);

            // @ts-ignore: does not really need to be declared as optional
            assertEquals(delete bottle.container.hops, true);

            assertEquals(bottle.container.beer instanceof Beer, true);
            assertSpyCalls(ancestorProviders.water, 1);
            assertSpyCalls(ancestorProviders.barley, 1);
            assertSpyCalls(providers.beer, 2);
            assertSpyCalls(ancestorProviders.hops, 2);
        },
    );

    await t.step(
        'should not throw if [[Delete]] is performed over a non-existant service ',
        async () => {
            // @ts-ignore: does not really need to be declared as optional
            assertEquals(delete bottle.container.malt, true);
        },
    );

    await t.step(
        'should never call the factory of an unaccessed service',
        async () => {
            assertSpyCalls(ancestorProviders.now, 0);
        },
    );

    await t.step(
        'should be able to remove an instance without reseting the dependents',
        async () => {
            assertSpyCalls(ancestorProviders.water, 1);
            assertSpyCalls(ancestorProviders.barley, 1);
            assertSpyCalls(ancestorProviders.hops, 2);
            assertSpyCalls(providers.beer, 2);

            assertEquals(bottle.delete('hops', false), true);

            assertEquals(bottle.container.hops instanceof Hops, true);
            assertSpyCalls(ancestorProviders.water, 1);
            assertSpyCalls(ancestorProviders.barley, 1);
            assertSpyCalls(providers.beer, 2);
            assertSpyCalls(ancestorProviders.hops, 3);
        },
    );
});

Deno.test('Bottle (with multiple ancestors chain)', async (t) => {
    const ancientProviders = {
        water: spy(() => new Water()),
        now: spy(() => Date.now),
    };
    const ancient = new Bottle(ancientProviders);

    const secondProviders = {
        barley: spy(({ water }: { water: Water }) => new Barley(water)),
        hops: spy(({ water }: { water: Water }) => new Hops(water)),
    };

    const second = new Bottle(secondProviders, ancient);

    const thirdProviders = {
        beer: spy((
            { barley, hops, water }: {
                barley: Barley;
                hops: Hops;
                water: Water;
            },
        ) => new Beer('San Miguel', barley, hops, water)),
    };
    const bottle = new Bottle(thirdProviders, second);

    await t.step(
        'should respond to "in" operator without triggering instantiation nor throwing',
        async () => {
            assertEquals('now' in bottle.container, true);
            assertSpyCalls(ancientProviders.now, 0);
            // will not throw
            assertEquals('malt' in bottle.container, false);
        },
    );

    await t.step(
        'should respond to [[OwnPropertyKeys]] operations with instantiated services (does not trigger instantiation)',
        async () => {
            assertEquals(Object.keys(bottle.container), []);
            assertEquals(Object.keys({ ...bottle.container }).length, 0);

            assertEquals(bottle.container.water instanceof Water, true);
            assertSpyCalls(ancientProviders.water, 1);

            assertEquals(Object.keys(bottle.container), ['water']);
            assertEquals(Object.keys({ ...bottle.container }).length, 1);
        },
    );

    await t.step('should throw if an unknown service is accessed', async () => {
        assertThrows(() => {
            // @ts-expect-error
            bottle.container.malt;
        });
    });

    await t.step('should invoke the factory on access time', async () => {
        assertSpyCalls(thirdProviders.beer, 0);
        assertEquals(bottle.container.beer.name, 'San Miguel');
        assertSpyCalls(thirdProviders.beer, 1);
    });

    await t.step('should only invoke once the same factory', async () => {
        assertEquals(bottle.container.beer.name, 'San Miguel');
        assertSpyCalls(thirdProviders.beer, 1);

        assertEquals(bottle.container.beer.water, bottle.container.water);
        assertEquals(bottle.container.beer.barley, bottle.container.barley);
        assertEquals(bottle.container.beer.hops, bottle.container.hops);
        assertEquals(bottle.container.barley.water, bottle.container.water);
        assertEquals(bottle.container.hops.water, bottle.container.water);

        assertSpyCalls(secondProviders.barley, 1);
        assertSpyCalls(secondProviders.hops, 1);
        assertSpyCalls(ancientProviders.water, 1);
    });

    await t.step(
        'should be able to remove an instance with the [[Delete]] operation',
        async () => {
            assertSpyCalls(ancientProviders.water, 1);
            assertSpyCalls(secondProviders.barley, 1);
            assertSpyCalls(secondProviders.hops, 1);
            assertSpyCalls(thirdProviders.beer, 1);

            // @ts-ignore: does not really need to be declared as optional
            assertEquals(delete bottle.container.hops, true);

            assertEquals(bottle.container.beer instanceof Beer, true);
            assertSpyCalls(ancientProviders.water, 1);
            assertSpyCalls(secondProviders.barley, 1);
            assertSpyCalls(thirdProviders.beer, 2);
            assertSpyCalls(secondProviders.hops, 2);
        },
    );

    await t.step(
        'should not throw if [[Delete]] is performed over a non-existant service ',
        async () => {
            // @ts-ignore: does not really need to be declared as optional
            assertEquals(delete bottle.container.malt, true);
        },
    );

    await t.step(
        'should never call the factory of an unaccessed service',
        async () => {
            assertSpyCalls(ancientProviders.now, 0);
        },
    );

    await t.step(
        'should be able to remove an instance without reseting the dependents',
        async () => {
            assertSpyCalls(ancientProviders.water, 1);
            assertSpyCalls(secondProviders.barley, 1);
            assertSpyCalls(secondProviders.hops, 2);
            assertSpyCalls(thirdProviders.beer, 2);

            assertEquals(bottle.delete('hops', false), true);

            assertEquals(bottle.container.hops instanceof Hops, true);
            assertSpyCalls(ancientProviders.water, 1);
            assertSpyCalls(secondProviders.barley, 1);
            assertSpyCalls(thirdProviders.beer, 2);
            assertSpyCalls(secondProviders.hops, 3);
        },
    );
});
