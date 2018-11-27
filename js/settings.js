// TRACK SETTINGS
TRACK_LENGTH = 20;
TRACK_MAX_ANGLE_DEG = 50;
PLATFORM_LENGTH = 2;
START_PLATFORM_LENGTH = 3;
STOP_PLATFORM_LENGTH = PLATFORM_LENGTH;

// CAR SETTINGS
WHEEL_SPEED = 15;
START_POSITION = [1.7, 0.7];
VERTICY_BOUNDS = [3, 10];
CHASSIS_DENSITY = 2;

// GAME WORLD SETTINGS
CAR_STUCK_TOL = 0.1;  // difference of the last and current positions
CAR_STUCK_CHECK_INTERVAL = 1000;  // in msecs
MAX_SKIP_NUM = 150;  // maximum number of skip number in UI
FRICTION = 3;

// ES SETTINGS
START_POP_SIZE = 20;
MU = START_POP_SIZE;
LAMBDA = Math.floor(MU / 2);
LENGTH_BOUNDS = [0.2, 1];
CHANGE_NUMVERTICIES_PROBABILITY = 0.05;
ANGLE_BOUNDS = [Math.PI / 8, Math.PI * (3/8)];
