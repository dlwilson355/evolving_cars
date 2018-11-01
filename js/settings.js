// TRACK SETTINGS
TRACK_LENGTH = 10;
TRACK_MAX_ANGLE_DEG = 40;
PLATFORM_LENGTH = 1.5;
STOP_LINE_LENGTH = 0.1;
START_PLATFORM_LENGTH = 2;

// CAR SETTINGS
WHEEL_SPEED = 15;
START_POSITION = [3, 1.2];

// GAME WORLD SETTINGS
CAR_STUCK_TOL = 0.1;  // difference of the last and current positions
CAR_STUCK_CHECK_INTERVAL = 1000;  // in msecs
MAX_SKIP_NUM = 150;  // maximum number of skip number in UI

// ES SETTINGS
START_POP_SIZE = 20;
MU = START_POP_SIZE;
LAMBDA = Math.floor(MU / 2);

BOUNDS = [[0, 2 * Math.pi], [0, 2],
          [0, 2 * Math.pi], [0, 2],
          [0, 2 * Math.pi], [0, 2],
          [0, 2 * Math.pi], [0, 2]]
