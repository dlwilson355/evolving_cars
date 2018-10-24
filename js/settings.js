TRACK_LENGTH = 100;
TRACK_MAX_ANGLE_DEG = 0;
POP_SIZE = 10;

function initial_population() {
    var cars_options = [];
    for (var i = 0; i < POP_SIZE; i++) {
        cars_options.push({
            radius_bw: 0.2,
            radius_fw: 0.2,
            length: Math.random(),
            speed: Math.random() * 2 + 8 // [8 - 10)
        });
    }
    return cars_options;
}
