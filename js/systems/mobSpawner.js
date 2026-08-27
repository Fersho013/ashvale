/* =====================================================================
   REPOSICIÓN DE POBLACIONES POR BIOMA
   Cada grupo conserva un máximo estricto. Cuando queda por debajo, inicia
   una única espera de cinco segundos y después crea exactamente el faltante.
   ===================================================================== */
import { ActiveMob, Slime, Wolf, Deer, GoblinExplorer } from '../entities/mobs.js';
import { ZONE3_BOUNDS, BIOME_AREAS, randomPointInArea } from '../world/map.js';

export const MOB_POPULATION_LIMITS = {
    activeMobs: 1,
    goblins: 3,
    wolves: 2,
    deers: 3,
    slimes: 8,
    bigSlimes: 3
};

const RESPAWN_DELAY_MS = 5_000;
const pendingRespawns = new Map();

const populationRules = [
    { key: 'activeMobs', max: MOB_POPULATION_LIMITS.activeMobs, area: ZONE3_BOUNDS, create: (x, y) => new ActiveMob(x, y) },
    { key: 'goblins', max: MOB_POPULATION_LIMITS.goblins, area: BIOME_AREAS.mines, create: (x, y, area) => new GoblinExplorer(x, y, area) },
    { key: 'wolves', max: MOB_POPULATION_LIMITS.wolves, area: BIOME_AREAS.forest, create: (x, y, area) => new Wolf(x, y, area) },
    { key: 'deers', max: MOB_POPULATION_LIMITS.deers, area: BIOME_AREAS.forest, create: (x, y, area) => new Deer(x, y, area) },
    // Este grupo solo crea Slimes normales. Los grandes nacen exclusivamente
    // por fusión en worldInteraction.js.
    {
        key: 'slimes', max: MOB_POPULATION_LIMITS.slimes, area: BIOME_AREAS.slimeMarsh,
        count: population => population.filter(slime => !slime.big).length,
        create: (x, y, area) => new Slime(x, y, false, area)
    }
];

function spawn(rule) {
    const mob = rule.create(0, 0, rule.area);
    const point = randomPointInArea(rule.area, mob);
    mob.x = point.x; mob.y = point.y;
    return mob;
}

export function maintainMobPopulations(world, now = Date.now()) {
    for (const rule of populationRules) {
        const population = world[rule.key];
        const currentCount = rule.count ? rule.count(population) : population.length;
        const missing = Math.max(0, rule.max - currentCount);
        if (missing === 0) {
            pendingRespawns.delete(rule.key);
            continue;
        }

        if (!pendingRespawns.has(rule.key)) {
            pendingRespawns.set(rule.key, now + RESPAWN_DELAY_MS);
            continue;
        }
        if (now < pendingRespawns.get(rule.key)) continue;

        // Se mide de nuevo en el momento de crear: si otro spawn o una fusión
        // cambió la cantidad durante la espera, jamás excede el máximo.
        const latestCount = rule.count ? rule.count(population) : population.length;
        const amount = Math.max(0, rule.max - latestCount);
        for (let i = 0; i < amount; i++) population.push(spawn(rule));
        pendingRespawns.delete(rule.key);
    }
}
