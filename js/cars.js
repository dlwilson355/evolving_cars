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

        var line = new Line(last_x, last_y, STOP_LINE_LENGTH, 0);
        lines.push(line);

        [last_x, last_y] = line.get_endpoint();
        line = new Line(last_x, last_y, START_PLATFORM_LENGTH, 0);
        lines.push(line);

        for (var i = 0; i < numberOfLines; i++){
            [last_x, last_y] = line.get_endpoint();

            var angle = Math.random() * 2 * MAX_ANGLE_RAD - MAX_ANGLE_RAD;
            if (i == numberOfLines - 1) {
                angle = 0;  // ensure the last peice of track is flat
            }
            line = new Line(last_x, last_y, PLATFORM_LENGTH, angle);
            lines.push(line);
        }
        [last_x, last_y] = line.get_endpoint();
        lines.push(new Line(last_x, last_y, STOP_LINE_LENGTH, 0));

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

            if (i == 0 || i == this.lines.length - 1) {
                this.edges.push(body);
            }
        }
    }
}


// A car chassis constructed from a convex object
class CarChassisConvex {
    constructor(options) {
        this.position = options["position"];
        this.vert = this.get_verticies(options['angles'], options['lengths']);
        this.body = new p2.Body({
            mass: 1,
            position: this.position
        });
        this.shape = new p2.Convex({ vertices: this.vert });
        this.shape.collisionGroup = CHASSIS;
        this.shape.collisionMask = TRACK;
        this.body.addShape(this.shape);
    }

    // we select random verticies to determine the shape of the convex chassis
    get_random_verticies() {
        var size = 1;
        var vertices = [];
        for(var i=0, N=4; i<N; i++){
            var a = 2*Math.PI / N * i;
            var vertex = [Math.random()*size*Math.cos(a), Math.random()*size*Math.sin(a)]; // Note: vertices are added counter-clockwise
            vertices.push(vertex);
        }
        return vertices
    }

    // we need to sort the verticies in counterclockwise order or else p2 throws an exception
    get_sorted_verticies(verts) {
        var radians = [];
        for (var i=0; i < verts.length; i++) {
            var radian = Math.atan2(verts[i][1], verts[i][0]);
            if (radian < 0) {
                radian += 2*Math.PI;
            }
            radians.push(radian);
        }
        var sorted_verticies = [];
        // TODO: potential issue if two radians are equal
        for (var i=0; i < verts.length; i++) {
            var index = radians.indexOf(Math.min.apply(Math, radians));
            sorted_verticies.push(verts[index]);
            radians[index] = 10;
        }
        return sorted_verticies
    }

    get_verticies(angles, lengths) {
        [angles, lengths] = this.fix_errors(angles, lengths);
        var angles = angles.sort();
        var verts = [];
        for (var i=0; i<angles.length; i++) {
            var x = lengths[i] * Math.cos(angles[i]);
            var y = lengths[i] * Math.sin(angles[i]);
            verts.push([x, y]);
        }
        return verts;
    }

    // a temporary functions to prevent exceptions thrown by the renderer if verticies are two close to the origion or if their angles aren't far enough apart
    // we will need to find a better solution to this
    fix_errors(angles, lengths) {
        var prev_angle = angles[3];
        for (var i=0; i<lengths.length; i++) {
            // fix the exception that occurs if the length is too small
            if (lengths[i] < 0.5) {
                lengths[i] = 0.5;
            }
            // fix the exception that occurs if the angles are too close
            if (Math.abs(angles[i] - prev_angle) < 0.4) {
                angles = [0, .5*Math.PI, Math.PI, 1.5*Math.PI];
            }
            prev_angle = angles[i];
        }
        return [angles, lengths]
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
        return [this.position[0] + this.vert[2][0], this.position[1] + this.vert[2][1]]
    }

    get_front_wheel_position() {
        return [this.position[0] + this.vert[3][0], this.position[1] + this.vert[3][1]]
    }

    attach_back_wheel(wheel) {
        var revolute = new p2.RevoluteConstraint(this.body, wheel.body, {
            worldPivot: [this.position[0] + this.vert[2][0], this.position[1] + this.vert[2][1]],
            collideConnected: false
        });
        revolute.enableMotor();
        // Rotational speed in radians per second
        revolute.setMotorSpeed(wheel.speed);

        this.world.addConstraint(revolute);

        this.back_revolute = revolute;
    }

    attach_front_wheel(wheel) {
        var revolute = new p2.RevoluteConstraint(this.body, wheel.body, {
            worldPivot: [this.position[0] + this.vert[3][0], this.position[1] + this.vert[3][1]],
            collideConnected: false
        });
        this.world.addConstraint(revolute);

        this.front_revolute = revolute;
    }
}


class CarChassisLine {
    constructor(options) {
        this.position = options["position"];
        this.length = options["length"];
        this.height = options["height"];

        this.body = new p2.Body({
            mass: 1,
            position: this.position
        });
        this.shape = new p2.Box({
            width: this.length,
            height: this.height
        });
        this.shape.collisionGroup = CHASSIS;
        this.shape.collisionMask = TRACK;
        this.body.addShape(this.shape);
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
        return [this.body.position[0] - 0.5 * this.length,
                this.body.position[1]]
    }

    get_front_wheel_position() {
        return [this.body.position[0] + 0.5 * this.length,
                this.body.position[1]]
    }

    attach_back_wheel(wheel) {
        var revolute = new p2.RevoluteConstraint(this.body, wheel.body, {
            localPivotA: [-0.5 * this.length, 0],
            localPivotB: [0, 0],
            collideConnected: false
        });
        revolute.enableMotor();
        // Rotational speed in radians per second
        revolute.setMotorSpeed(wheel.speed);

        this.world.addConstraint(revolute);

        this.back_revolute = revolute;
    }

    attach_front_wheel(wheel) {
        // make the front wheel heavier so that it can't be
        // pushed up by high speed of the back wheel
        wheel.body.mass = 1;
        var revolute = new p2.RevoluteConstraint(this.body, wheel.body, {
            localPivotA: [0.5 * this.length, 0],
            localPivotB: [0, 0],
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
        this.length = options["length"];
        this.speed = 3;
        if ("speed" in options) {
            this.speed = options["speed"]
        }
        this.removed = false;
    }

    add_to_world(world) {
        this.world = world;

        // x=2 not to hit the first platform
        var car_position = [2, 0.5];
        var chassis_height = 0.05;

        // Create chassis for our car
        var chassis = new CarChassisLine({
            position: car_position,
            height: chassis_height,
            length: this.length
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


// Daniel's new class for creating cars with convex chassis
// I am leaving the regular car class for now.
class ConvexCar {
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
        var chassis = new CarChassisConvex({
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
