prev_parents = null;

function get_empty_options() {
    return {
        'angles_lengths': {
            'data': [],
            'step_sizes': []
        },
        'wheel_pos': {
            'data': [],
            'step_sizes': []
        }
    }
}


function get_initial_options(N, max_length=1, max_angle_step_frac=16, max_length_step_frac=10, max_wheel_step_frac=10) {
    var options = get_empty_options();

    // angles and lengths
    for(var i = 0; i < N; i++){
        options['angles_lengths']['data'].push(Math.random() * (ANGLE_BOUNDS[1] - ANGLE_BOUNDS[0]) + ANGLE_BOUNDS[0]); // angle
        options['angles_lengths']['data'].push(Math.random() * (LENGTH_BOUNDS[1] - LENGTH_BOUNDS[0]) + LENGTH_BOUNDS[0]); // length

        options['angles_lengths']['step_sizes'].push(Math.random() * Math.PI / max_angle_step_frac);
        options['angles_lengths']['step_sizes'].push(Math.random() * max_length / max_length_step_frac)
    }

    // wheel positions
    options['wheel_pos']['data'].push(Math.random()); // back
    options['wheel_pos']['data'].push(Math.random()); // front

    options['wheel_pos']['step_sizes'].push(Math.random() / max_wheel_step_frac);
    options['wheel_pos']['step_sizes'].push(Math.random() / max_wheel_step_frac);

    return options;
}


function create_child(options) {
    return {
        radius_bw: 0.15,
        radius_fw: 0.15,
        speed: WHEEL_SPEED,

        options: options,
        angles_lengths: options['angles_lengths']['data'],
        wheel_pos: options['wheel_pos']['data']
    }
}


function initial_population(pop_size) {
    var cars_options = [];

    for (var i = 0; i < pop_size; i++) {
        num_verticies = Math.floor(Math.random() * (VERTICY_BOUNDS[1] - VERTICY_BOUNDS[0])) + VERTICY_BOUNDS[0];
        cars_options.push(
            create_child(
                get_initial_options(num_verticies)
            )
        );
    }

    prev_parents = cars_options;
    return cars_options;
}


function fitness(genome) {
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


function mutate(parent_optns, length_bounds) {
    var child_optns = get_initial_options();

    var tau, tau_p;

    // angles and lengths
    angles_lengths = parent_optns['angles_lengths']['data'];
    step_sizes = parent_optns['angles_lengths']['step_sizes'];
    tau = Math.pow(Math.sqrt(2.0 * step_sizes.length), -1.0);
    tau_p = Math.pow(Math.sqrt(2.0 * Math.sqrt(step_sizes.length)), -1.0);

    for (var i = 0; i < angles_lengths.length; i += 2) {
        // mutate the angle
        var ch_angle = angles_lengths[i] + step_sizes[i] * random_gaussian();
        // make sure the angle lies within the bounds
        if (ch_angle < ANGLE_BOUNDS[0]) {
            ch_angle = ANGLE_BOUNDS[0];
        }
        if (ch_angle > ANGLE_BOUNDS[1]) {
            ch_angle = ANGLE_BOUNDS[1];
        }
        child_optns['angles_lengths']['data'][i] = ch_angle;

        // mutate the length
        var ch_length = angles_lengths[i + 1] + step_sizes[i + 1] * random_gaussian();
        if (ch_length < length_bounds[0]) {
            ch_length = length_bounds[0];
        }
        if (ch_length > length_bounds[1]) {
            ch_length = length_bounds[1];
        }
        child_optns['angles_lengths']['data'][i + 1] = ch_length;

        // mutate the step sizes
        var ch_ss_ang = step_sizes[i] * Math.exp(tau_p * random_gaussian() + tau * random_gaussian());
        var ch_ss_len = step_sizes[i+1] * Math.exp(tau_p * random_gaussian() + tau * random_gaussian());

        child_optns['angles_lengths']['step_sizes'][i] = ch_ss_ang;
        child_optns['angles_lengths']['step_sizes'][i+1] = ch_ss_len;
    }

    // wheel positions
    wheel_pos = parent_optns['wheel_pos']['data'];
    step_sizes = parent_optns['wheel_pos']['step_sizes'];
    tau = Math.pow(Math.sqrt(2.0 * step_sizes.length), -1.0);
    tau_p = Math.pow(Math.sqrt(2.0 * Math.sqrt(step_sizes.length)), -1.0);

    for (var i = 0; i < wheel_pos.length; i++) {
        var ch_pos = wheel_pos[i] + step_sizes[i] * random_gaussian();
        ch_pos = (ch_pos + 1) % 1; // only from 0 to 1 circularly
        child_optns['wheel_pos']['data'][i] = ch_pos;

        var ch_ss_pos = step_sizes[i] * Math.exp(tau_p * random_gaussian() + tau * random_gaussian());
        child_optns['wheel_pos']['step_sizes'][i] = ch_ss_pos;
    }

    return child_optns;
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
    for (var i = 0; i < LAMBDA; i++) {
        do {
            var random_ix = Math.floor(Math.random() * MU);
        } while (selected_parents.includes(random_ix))
        selected_parents.push(random_ix);

        var parent = prev_parents[random_ix];
        children.push(
            create_child(
                mutate(parent.options, LENGTH_BOUNDS)
            )
        );
    }

    var mean = 0;
    for (var i = 0; i < prev_parents.length; i++) {
        mean += fitness(prev_parents[i]);
    }
    mean /= prev_parents.length;

    return children;
}
