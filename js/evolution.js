function fitness(genome) {
    // genome is a dict of car options + position
    return genome["position"];
}

function do_evolution(population) {
    // population is defined by cars options (see constructor)
    for (var i = 0; i < population.length; i++) {
        console.log(fitness(population[i]));
        // population[i]["length"] *= 1.5;
    }

    return population;
}
