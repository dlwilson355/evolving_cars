MAX_ANGLE_RAD = TRACK_MAX_ANGLE_DEG * Math.PI / 180;

var WHEEL = Math.pow(2,0), // 00000000000000000000000000000001 in binary
    CHASSIS =  Math.pow(2,1), // 00000000000000000000000000000010 in binary
    TRACK = Math.pow(2,2)  // 00000000000000000000000000000100 in binary


class Line {
    constructor(x, y, length=1, angle=0) {
        this.x = x + length * Math.cos(angle) / 2;
        this.y = y + length * Math.sin(angle) / 2;
        this.length = length;
        this.angle = angle;
    }

    get_endpoint() {
        return [this.x + this.length * Math.cos(this.angle) / 2,
                this.y + this.length * Math.sin(this.angle) / 2];
    }
}


class Track {
    constructor(numberOfLines) {
        var lines = [];
        var last_x = 0;
        var last_y = 0;

        var line = new Line(last_x, last_y, START_PLATFORM_LENGTH, -Math.PI / 12);
        lines.push(line);

        for (var i = 0; i < numberOfLines; i++){
            [last_x, last_y] = line.get_endpoint();

            var angle = Math.random() * 2 * MAX_ANGLE_RAD - MAX_ANGLE_RAD;
            line = new Line(last_x, last_y, PLATFORM_LENGTH, angle);
            lines.push(line);
        }

        [last_x, last_y] = line.get_endpoint();
        lines.push(new Line(last_x, last_y, STOP_PLATFORM_LENGTH, 0));

        this.lines = lines;
    }

    add_to_world(world) {
        this.edges = []
        for (var i = 0; i < this.lines.length; i++) {
            var line = new p2.Box({width: this.lines[i].length, height: .1});
            line.collisionGroup = TRACK;
            line.collisionMask = CHASSIS | WHEEL;

            var body = new p2.Body({position: [this.lines[i].x, this.lines[i].y],
                                angle: this.lines[i].angle});
            body.addShape(line);
            world.addBody(body);

            if (i == this.lines.length - 1) {
                this.edges.push(body);
            }
        }
    }
}


class CarChassis {
    constructor(options) {
        this.position = options["position"];
        this.angles = options['angles'];
        this.lengths = options['lengths'];
        this.vert = this.get_verticies(this.angles, this.lengths);
        this.body = new p2.Body({
            mass: 1,
            position: this.position
        });
        this.body.fromPolygon(this.vert);
        for (var i=0; i<this.body.shapes.length; i++) {
            this.body.shapes[i].collisionGroup = CHASSIS;
            this.body.shapes[i].collisionMask = TRACK;
        }
    }

    get_verticies(angles, lengths) {
        var sorted_angles = angles.sort();
        var vs = [];
        for (var i=0; i<sorted_angles.length; i++) {
            var x = lengths[i] * Math.cos(sorted_angles[i]);
            var y = lengths[i] * Math.sin(sorted_angles[i]);
            vs.push([x, y]);
        }
        return vs;
    }

    get_verticy(verticy_number, angles, lengths) {
        return [lengths[verticy_number] * Math.cos(angles[verticy_number]), lengths[verticy_number] * Math.sin(angles[verticy_number])]
    }

    add_to_world(world) {
        world.addBody(this.body);
        this.world = world;
    }

        // To fix the camera
    get_center_body() {
        return this.body;
    }

    get_back_wheel_position() {
        var verticy = this.get_verticy(2, this.angles, this.lengths);
        return [this.position[0] + verticy[0], this.position[1] + verticy[1]]
    }

    get_front_wheel_position() {
        var verticy = this.get_verticy(3, this.angles, this.lengths);
        return [this.position[0] + verticy[0], this.position[1] + verticy[1]]
    }

    attach_back_wheel(wheel) {
        var verticy = this.get_verticy(2, this.angles, this.lengths);
        var revolute = new p2.RevoluteConstraint(this.body, wheel.body, {
            worldPivot: [this.position[0] + verticy[0], this.position[1] + verticy[1]],
            collideConnected: false
        });
        revolute.enableMotor();
        // Rotational speed in radians per second
        revolute.setMotorSpeed(wheel.speed);

        this.world.addConstraint(revolute);

        this.back_revolute = revolute;
    }

    attach_front_wheel(wheel) {
        var verticy = this.get_verticy(3, this.angles, this.lengths);
        var revolute = new p2.RevoluteConstraint(this.body, wheel.body, {
            worldPivot: [this.position[0] + verticy[0], this.position[1] + verticy[1]],
            collideConnected: false
        });
        this.world.addConstraint(revolute);

        this.front_revolute = revolute;
    }
}


class CarWheel {
    constructor(options) {
        this.speed = 3;
        if ("speed" in options) {
            this.speed = options["speed"]
        }
        this.position = options["position"]
        this.radius = options["radius"]

        this.body = new p2.Body({
            mass: 1,
            position: this.position
        });
        this.shape = new p2.Circle({radius: this.radius});
        this.shape.collisionGroup = WHEEL;
        this.shape.collisionMask = TRACK;
        this.body.addShape(this.shape);
    }

    add_to_world(world) {
        world.addBody(this.body);
    }
}


class Car {
    constructor(options) {
        // bw - back wheel, fw - front wheel
        this.radius_bw = options["radius_bw"];
        this.radius_fw = options["radius_fw"];
        this.speed = 3;
        [this.angles, this.lengths] = this.get_angles_and_lengths(options["options"])
        if ("speed" in options) {
            this.speed = options["speed"]
        }
        this.removed = false;
    }

    // returns the angles and verticies from the genome vector
    get_angles_and_lengths(genome) {
        var angles = [];
        var verticies = [];
        for (var i=0; i<genome.length-1; i+=2) {
            angles.push(genome[i]);
            verticies.push(genome[i+1]);
        }
        return [angles, verticies]
    }

    add_to_world(world) {
        this.world = world;

        // x=2 not to hit the first platform
        var car_position = START_POSITION;

        // Create chassis for our car
        var chassis = new CarChassis({
            position: START_POSITION,
            angles: this.angles,
            lengths: this.lengths
        })
        chassis.add_to_world(world);

        // Create wheels
        var back_wheel = new CarWheel({
            position: chassis.get_back_wheel_position(),
            radius: this.radius_bw,
            speed: this.speed,
        });
        back_wheel.add_to_world(world);

        var front_wheel = new CarWheel({
            position: chassis.get_front_wheel_position(),
            radius: this.radius_fw
        });
        front_wheel.add_to_world(world);

        chassis.attach_front_wheel(front_wheel);
        chassis.attach_back_wheel(back_wheel);

        this.chassis = chassis;
        this.back_wheel = back_wheel;
        this.front_wheel = front_wheel;

        this.bodies = [this.chassis.body, this.back_wheel.body, this.front_wheel.body]
    }

    remove_from_world() {
        this.world.removeConstraint(this.chassis.back_revolute);
        this.world.removeConstraint(this.chassis.front_revolute);
        this.world.removeBody(this.chassis.body);
        this.world.removeBody(this.back_wheel.body);
        this.world.removeBody(this.front_wheel.body);

        this.removed = true;
    }

    has_body(body) {
        return this.bodies.includes(body)
    }

    get_position() {
        return this.chassis.body.position;
    }

    // To fix the camera
    get_center_body() {
        return this.chassis.get_center_body();
    }
}
