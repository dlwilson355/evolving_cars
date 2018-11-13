function get_initial_options(N, max_length=1, max_angle_step_frac=16, max_length_step_frac=10) {
    var angles_lengths = [];
    var step_sizes = []
    for(var i = 0; i < N; i++){
        angles_lengths.push(2 * Math.random() * Math.PI); // angle
        angles_lengths.push(Math.random() * max_length); // length

        step_sizes.push(Math.random() * Math.PI / max_angle_step_frac);
        step_sizes.push(Math.random() * max_length / max_length_step_frac)
    }

    return [angles_lengths, step_sizes];
}


function get_random_step_sizes(N, size=1) {
    var step_sizes = [];
    for(var i = 0; i < N; i++){
        var a = 2*Math.PI / N * i;
        var step_size = [Math.random()]; // Note: step_sizes are added counter-clockwise
        step_sizes.push(step_size);
    }
    return step_sizes
}


function create_child(options, step_sizes) {
    return {
        radius_bw: 0.15,
        radius_fw: 0.15,
        speed: WHEEL_SPEED, // [8 - 10)

        // vertices ...
        options: options,
        step_sizes: step_sizes,
    }
}


function initial_population(pop_size) {
    var cars_options = [];
    var verticies_min = 3;
    var verticies_max = 8;
    var options, step_sizes;

    for (var i = 0; i < pop_size; i++) {
        num_verticies = Math.floor(Math.random() * (verticies_max - verticies_min)) + verticies_min;
        [options, step_sizes] = get_initial_options(num_verticies);
        cars_options.push(create_child(options, step_sizes));
    }

    return cars_options;
}


function fitness(genome) {
    // genome is a dict of car options + position
    return genome["position"];
}

function random_gaussian(mean=0.0, stdev=1.0) {
    var u1 = 0, u2 = 0, w = 0;
    for (;;) {
        u1 = 2 * Math.random() - 1;
        u2 = 2 * Math.random() - 1;
        w = u1 * u1 + u2 * u2;
        if (w < 1) {
            break;
        }
    }

    w = Math.sqrt((-2.0 * Math.log(w)) / w);
    return mean + (u2 * w) * stdev;
}


function mutate(parent, step_sizes, length_bounds) {
    var child = [];
    var child_step_sizes = []

    var tau = Math.pow(Math.sqrt(2.0 * step_sizes.length), -1.0);
    var tau_p = Math.pow(Math.sqrt(2.0 * Math.sqrt(step_sizes.length)), -1.0);

    for (var i = 0; i < parent.length-1; i+=2) {
        // mutate the angle
        child[i] = parent[i] + step_sizes[i] * random_gaussian();
        if (child[i] > (Math.PI * 2)) {
            child[i] = child[i] - (Math.PI * 2)
        }
        //mutate the length
        child[i+1] = parent[i+1] + step_sizes[i+1] * random_gaussian();
        // make sure lengths lie within bounds
        if (child[i+1][0] < length_bounds[0]) {
            child[i+1][0] = length_bounds[0];
        }
        if (child[i+1] > length_bounds[1]) {
            child[i+1] = length_bounds[1];
        }
        // mutate the step sizes
        child_step_sizes[i] = step_sizes[i] * Math.exp(tau_p * random_gaussian() + tau * random_gaussian());
        child_step_sizes[i+1] = step_sizes[i+1] * Math.exp(tau_p * random_gaussian() + tau * random_gaussian());
    }

    return [child, child_step_sizes];
}

function get_cars_sorted_by_rank(population) {
    // first separate the placed and unplaced cars
    placed_cars = [];
    unplaced_cars = [];
    for (i=0; i<population.length; i++) {
        if ('place' in population[i]) {
            placed_cars.push(population[i]);
        }
        else {
            unplaced_cars.push(population[i])
        }
    }
    // sort the placed cars based on the position they placed in
    placed_cars.sort(function(a, b) {return a['place'] - b['place']})
    // sort the non-placed cars based on the distance they traveled
    unplaced_cars.sort(function(a, b) {return b['position'] - a['position']})
    sorted_cars = placed_cars.concat(unplaced_cars);
    return sorted_cars;
}

function do_evolution(population) {
    // population is defined by cars options (see constructor)
    var all_sorted_population = population.concat(prev_parents);
    all_sorted_population = get_cars_sorted_by_rank(all_sorted_population);

    prev_parents = all_sorted_population.slice(0, MU);

    var children = []
    var selected_parents = [];
    var options, step_sizes;
    for (var i = 0; i < LAMBDA; i++) {
        do {
            var random_ix = Math.floor(Math.random() * MU);
        } while (selected_parents.includes(random_ix))
        selected_parents.push(random_ix);

        var parent = prev_parents[random_ix];

        [options, step_sizes] = mutate(parent.options, parent.step_sizes, LENGTH_BOUNDS);
        children.push(create_child(options, step_sizes));
    }

    var mean = 0;
    for (var i = 0; i < prev_parents.length; i++) {
        mean += fitness(prev_parents[i]);
    }
    mean /= prev_parents.length;

    return children;
}
