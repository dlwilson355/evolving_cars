function fitness(genome) {
    // genome is a Car class object
    return genome.get_position()[0];
}

function do_evolution(population) {
    for (var i = 0; i < population.length; i++) {
        console.log(fitness(population[i]));
    }
}
