import {
    assertEquals,
    assertSpyCalls,
    assertThrows,
    spy,
} from '../dev_deps.ts';
import { Bottle } from './bottle.ts';
import { serviceFactory } from './service-factory.ts';

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

Deno.test('service (typecheck)', async (t) => {
    await t.step(
        "should infer an impossible container when all deps can't be provided",
        async () => {
            const bottle = new Bottle({
                hops: spy(
                    serviceFactory(
                        (water: Water) => new Hops(water),
                        ['water'] as const,
                    ),
                ),
                waterrrrr: spy(serviceFactory(() => new Water())),
            });
            assertThrows(() => {
                // @ts-expect-error: should prevent container access as it is
                // impossible to provide the "water" service required by "hops"
                bottle.container.hops;
            });
        },
    );
});

Deno.test('serviceFactory', async (t) => {
    const providers = {
        barley: spy(
            serviceFactory(
                (water: Water) => new Barley(water),
                ['water'] as const,
            ),
        ),
        hops: spy(
            serviceFactory(
                (water: Water) => new Hops(water),
                ['water'] as const,
            ),
        ),
        beer: spy((
            { barley, hops, water }: {
                barley: Barley;
                hops: Hops;
                water: Water;
            },
        ) => new Beer('San Miguel', barley, hops, water)),
        water: spy(serviceFactory(() => new Water())),
        now: spy(() => Date.now),
    };
    const bottle = new Bottle(providers);

    await t.step(
        'should respond to "in" operator without triggering instantiation nor throwing',
        async () => {
            assertEquals('barley' in bottle.container, true);
            assertSpyCalls(providers.barley, 0);
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
