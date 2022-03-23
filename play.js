//                   ---===≡≡≡ machinegame ≡≡≡===---
function proximity(l, r) {
    var h = Math.abs(l.x - r.x);
    var v = Math.abs(l.y - r.y);
    return Math.max(h, v);
}
function comparePoints(l, r) {
    if ((l.x === r.x) && (l.y === r.y)) {
        return 0;
    }
    var dL = Math.max(Math.abs(l.x), Math.abs(l.y));
    var dR = Math.max(Math.abs(r.x), Math.abs(r.y));
    if (dL < dR) {
        return -1;
    }
    else if (dL > dR) {
        return 1;
    }
    // The top row
    if (l.y === (0 - dL)) {
        if (r.y === (0 - dL)) {
            return l.x < r.x ? -1 : 1;
        }
        else {
            return -1;
        }
    }
    if (r.y === (0 - dL)) {
        return 1;
    }
    // The right side
    if (l.x === dL) {
        if (r.x === l.x) {
            return l.y < r.y ? -1 : 1;
        }
        else {
            return -1;
        }
    }
    if (r.x === dL) {
        return 1;
    }
    // The bottom
    if (l.y === dL) {
        if (r.y == l.y) {
            return l.x > r.x ? -1 : 1; // Not an error
        }
        else {
            return -1;
        }
    }
    return l.y > r.y ? -1 : 1;
}
var iteration = 0;
var locationProvider = (function () {
    console.log('Initializing the location provider');
    var unexploredLocations = [];
    for (var distance = 1; distance < 50; distance += 1) {
        for (var x = 0 - distance; x <= distance; ++x) {
            unexploredLocations.push({ x: x, y: 0 - distance });
        }
        for (var y = 0 - distance + 1; y <= distance; ++y) {
            unexploredLocations.push({ x: distance, y: y });
        }
        for (var x = distance - 1; x >= 0 - distance; --x) {
            unexploredLocations.push({ x: x, y: distance });
        }
        for (var y = distance - 1; y > 0 - distance; --y) {
            unexploredLocations.push({ x: 0 - distance, y: y });
        }
    }
    unexploredLocations.sort(comparePoints);
    function markAsExplored(locations) {
        var millisecondsStart = Date.now();
        locations.sort(comparePoints);
        var minPossibleValue = 0;
        var indexesToDelete = [];
        var lastLocation = undefined;
        for (var _i = 0, locations_1 = locations; _i < locations_1.length; _i++) {
            var l = locations_1[_i];
            if (lastLocation && lastLocation.x == l.x && lastLocation.y == l.y) {
                continue;
            }
            var maxPossibleValue = unexploredLocations.length - 1;
            var found = false;
            while (minPossibleValue <= maxPossibleValue) {
                var midPoint = Math.floor((minPossibleValue + maxPossibleValue) / 2);
                var comparison = comparePoints(l, unexploredLocations[midPoint]);
                if (comparison < 0) {
                    maxPossibleValue = midPoint - 1;
                }
                else if (comparison > 0) {
                    minPossibleValue = midPoint + 1;
                }
                else {
                    //console.log(`Going to delete location ${l.x}, ${l.y} at index ${midPoint}`);
                    indexesToDelete.push(midPoint);
                    found = true;
                    break;
                }
            }
        }
        var totalRemoved = 0;
        if (indexesToDelete.length > 0) {
            var lastValue = indexesToDelete.pop();
            unexploredLocations.splice(lastValue, 1);
            while (indexesToDelete.length > 0) {
                var value = indexesToDelete.pop();
                if (value != lastValue) {
                    unexploredLocations.splice(value, 1);
                    lastValue = value;
                    ++totalRemoved;
                }
            }
        }
        var millisecondsEnd = Date.now();
        console.log("markAsExplored. Processing " + locations.length + " locations and removed " + totalRemoved + ". Unexplored Locations Length = " + unexploredLocations.length + ". Milliseconds Taken: " + (millisecondsEnd - millisecondsStart));
    }
    function getNext(count) {
        return unexploredLocations.slice(0, count);
    }
    return {
        markAsExplored: markAsExplored,
        getNext: getNext
    };
})();
var chargeRegister = (function () {
    var knownCharges = [];
    return {
        incorporate: function (charges) {
            charges.sort(comparePoints);
            // TODO: make this much faster
            var toAdd = [];
            for (var _i = 0, charges_1 = charges; _i < charges_1.length; _i++) {
                var c = charges_1[_i];
                var found = false;
                for (var _a = 0, knownCharges_1 = knownCharges; _a < knownCharges_1.length; _a++) {
                    var kc = knownCharges_1[_a];
                    if ((kc.x == c.x) && (kc.y == c.y)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    toAdd.push(c);
                }
            }
            knownCharges = knownCharges.concat(toAdd);
            knownCharges.sort(comparePoints);
        },
        getAll: function () {
            return knownCharges.slice();
        },
        remove: function (chargeToRemove) {
            for (var i = 0; i < knownCharges.length; ++i) {
                var thisCharge = knownCharges[i];
                if (thisCharge.x == chargeToRemove.x && thisCharge.y == chargeToRemove.y) {
                    knownCharges.splice(i, 1);
                    return;
                }
            }
        }
    };
})();
var getGuardPositions = (function () {
    var positions = [
        { x: -1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
        { x: -3, y: -3 },
        { x: 3, y: 3 },
        { x: -3, y: 3 },
        { x: 3, y: -3 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 3, y: 0 },
        { x: -3, y: 0 },
        { x: 0, y: -3 },
        { x: 0, y: 3 },
        { x: 4, y: 4 },
        { x: 4, y: -4 },
        { x: -4, y: 4 },
        { x: -4, y: -4 },
        { x: -4, y: 0 },
        { x: 4, y: 0 },
        { x: 0, y: 4 },
        { x: 0, y: -4 }
    ];
    return function (count) {
        var result = [];
        while (result.length < count) {
            result = result.concat(positions.slice(0, count - result.length));
        }
        result = result.map(function (p) { return { x: p.x, y: p.y }; });
        return result;
    };
})();
var enemyFlag = undefined;
function guardedMoveTo(robot, pos) {
    if (robot.x == pos.x && robot.y == pos.y) {
        return;
    }
    try {
        //console.log(`Moving robot at (${robot.x}, ${robot.y}) to (${pos.x}, ${pos.y})`);
        robot.moveTo(pos);
        //console.log(`Returned from robot.moveTo`);
    }
    catch (e) {
        console.error("Error when invoking robot.moveTo");
        console.error(e);
    }
}
function assignRobotsToLocations(availableRobots, locations, doAssignment) {
    var proximities = [];
    availableRobots.sort(comparePoints);
    locations.sort(comparePoints);
    var assignments = [];
    var _loop_1 = function (r) {
        var quickAssignment = undefined;
        var _loop_3 = function (l) {
            var prox = proximity(r, l);
            if (prox === 0) {
                var assignment = { robot: r, location: l };
                assignments.push(assignment);
                proximities = proximities.filter(function (entry) { return (entry.robot !== r) && (entry.location !== l); });
                quickAssignment = assignment;
                return "break";
            }
            else {
                proximities.push({
                    robot: r,
                    location: l,
                    proximity: prox
                });
            }
        };
        for (var _i = 0, locations_2 = locations; _i < locations_2.length; _i++) {
            var l = locations_2[_i];
            var state_1 = _loop_3(l);
            if (state_1 === "break")
                break;
        }
        if (quickAssignment) {
            locations.splice(locations.indexOf(quickAssignment.location), 1);
        }
    };
    for (var _i = 0, availableRobots_1 = availableRobots; _i < availableRobots_1.length; _i++) {
        var r = availableRobots_1[_i];
        _loop_1(r);
    }
    proximities.sort(function (l, r) {
        if (l.proximity < r.proximity) {
            return 1;
        }
        else if (l.proximity > r.proximity) {
            return -1;
        }
        else {
            return 0;
        }
    });
    var _loop_2 = function () {
        var p = proximities.pop();
        assignments.push({ robot: p.robot, location: p.location });
        proximities = proximities.filter(function (prox) { return prox.robot != p.robot && prox.location != p.location; });
    };
    while (proximities.length) {
        _loop_2();
    }
    doAssignment = doAssignment || function (robot, location) {
        robot.moveTo(location);
        return true;
    };
    for (var _a = 0, assignments_1 = assignments; _a < assignments_1.length; _a++) {
        var a = assignments_1[_a];
        availableRobots.splice(availableRobots.indexOf(a.robot), 1);
        locations.splice(locations.indexOf(a.location), 1);
        if (!doAssignment(a.robot, a.location)) {
            break;
        }
    }
}
function play(state) {
    ++iteration;
    var millisecondsStart = Date.now();
    console.log(iteration + ": Starting iteration " + iteration);
    var availableRobots = state.robots.filter(function (r) { return !!r; });
    var countOfAllRobots = availableRobots.length;
    var locationsOccupied = [];
    for (var _i = 0, availableRobots_2 = availableRobots; _i < availableRobots_2.length; _i++) {
        var r_1 = availableRobots_2[_i];
        for (var dx = -4; dx <= 4; ++dx) {
            for (var dy = -4; dy <= 4; ++dy) {
                locationsOccupied.push({
                    x: r_1.x + dx,
                    y: r_1.y + dy
                });
            }
        }
    }
    locationProvider.markAsExplored(locationsOccupied);
    chargeRegister.incorporate(state.charges.filter(function (c) { return !!c; }));
    if (state.red.robots.length) {
        console.log(iteration + ": Found enemy! " + state.red.robots.length + " enemy robots");
        var i = 0;
        var totalAttackers = 0;
        while (state.red.robots.length && availableRobots.length) {
            var enemy = state.red.robots[i];
            var closestRobot = undefined;
            var closestProximity = 100000;
            for (var _a = 0, availableRobots_3 = availableRobots; _a < availableRobots_3.length; _a++) {
                var r_2 = availableRobots_3[_a];
                var p = proximity(r_2, enemy);
                if (p < closestProximity) {
                    closestRobot = r_2;
                    closestProximity = p;
                }
            }
            if (closestRobot) {
                if (closestProximity <= 1) {
                    console.log(iteration + ": Robot at (" + closestRobot.x + ", " + closestRobot.y + " attacking enemy at " + enemy.x + ", " + enemy.y);
                    closestRobot.attack(enemy);
                    console.log("Returned from robot.attack(...)");
                }
                else if (closestProximity == 2) {
                    console.log(iteration + ": Robot at (" + closestRobot.x + ", " + closestRobot.y + " is 2 away from " + enemy.x + ", " + enemy.y);
                }
                else {
                    guardedMoveTo(closestRobot, enemy);
                }
                availableRobots.splice(availableRobots.indexOf(closestRobot), 1);
            }
            else {
                console.error("Closest robot is falsy!");
            }
            enemy.charges = enemy.charges - closestRobot.charges;
            console.log("enemy.charges now equals " + enemy.charges);
            if (enemy.charges > 0) {
                if (state.red.robots.length) {
                    i = (i + 1) % state.red.robots.length;
                }
            }
            else {
                state.red.robots.splice(state.red.robots.indexOf(enemy), 1);
                if (state.red.robots.length) {
                    i = i % state.red.robots.length;
                }
            }
            ++totalAttackers;
        }
    }
    enemyFlag = enemyFlag || state.red.flag;
    if (enemyFlag) {
        console.log(iteration + ": Found flag at (" + enemyFlag.x + ", " + enemyFlag.y + ")");
        for (var _b = 0, availableRobots_4 = availableRobots; _b < availableRobots_4.length; _b++) {
            var r = availableRobots_4[_b];
            guardedMoveTo(r, enemyFlag);
        }
        availableRobots.splice(0, availableRobots.length);
    }
    // Miners, guards and explorers
    var availableMiners = Math.ceil(availableRobots.length / 2);
    var chargedUpRobots = availableRobots.filter(function (r) { return r.charges >= 3; });
    var robotLimit = 250;
    var allowableRobots = robotLimit - countOfAllRobots;
    for (var _c = 0, chargedUpRobots_1 = chargedUpRobots; _c < chargedUpRobots_1.length; _c++) {
        var r_3 = chargedUpRobots_1[_c];
        if (--allowableRobots > 0) {
            r_3.clone();
            availableRobots.splice(availableRobots.indexOf(r_3), 1);
            --availableMiners;
        }
        else {
            console.log(iteration + ": Not cloning robots as we have too many!");
            break;
        }
    }
    var availableGuards = Math.ceil((availableRobots.length - availableMiners) / 2);
    var availableExplorers = Math.max(0, availableRobots.length - availableMiners - availableGuards);
    if (availableGuards > 0) {
        console.log(iteration + ": " + (Date.now() - millisecondsStart) + " assigning " + availableGuards + " guards");
        var guardLocations = getGuardPositions(availableGuards);
        assignRobotsToLocations(availableRobots, guardLocations);
        console.log(iteration + ": " + (Date.now() - millisecondsStart) + " completed assigning guards");
    }
    var assignedMiners = 0;
    assignRobotsToLocations(availableRobots, chargeRegister.getAll(), function (robot, location) {
        if (robot.x == location.x && robot.y == location.y) {
            robot.collect();
            chargeRegister.remove(location);
        }
        else {
            robot.moveTo(location);
        }
        return (++assignedMiners < availableMiners);
    });
    console.log(iteration + ": assigned " + assignedMiners + " miners");
    // Go into explorer mode
    if (availableRobots.length) {
        var timeSoFar = Date.now() - millisecondsStart;
        if (timeSoFar < 50) {
            console.log(iteration + ": " + (Date.now() - millisecondsStart) + " assigning exploration locations to " + availableRobots.length + " robots");
            var locationsToVisit = locationProvider.getNext(availableRobots.length);
            console.log(iteration + ": first exploration location is (" + locationsToVisit[0].x + ", " + locationsToVisit[0].y + ")");
            assignRobotsToLocations(availableRobots, locationsToVisit);
        }
        else {
            console.log(iteration + ": " + timeSoFar + " Not assigning explorers as there isn't enout time");
        }
    }
    var millisecondsEnd = Date.now();
    console.log(iteration + ": Returning from the method. Milliseconds = " + (millisecondsEnd - millisecondsStart));
}
// `state` contains information about what your robots can see:
// state = {
//  robots: [         → an array of your robots
//   { x, y,          → integers, the position of your robot on the grid
//     charges }      → integer, the health of your robot
//  ],
//  charges: [        → an array of charges on the ground
//   { x, y }
//  ],
//  red: {            → what you can see from the red player
//   robots: [        → red's robots
//    { x, y,         → the position of the robot
//      charges }     → the health of the robot
//    ],
//    flag: { x, y }  → red's flag, if you already found it
//  },
// }
// You can give one of 4 instructions to your robot:
//
// 1. robot.moveTo(destination)
//  The robot attempts to move to that position on the grid, one step each
//  turn, including diagonally (like a king in chess).
// `destination` can be either an object: `robot.moveTo(flag)` or coordinates
// `robot.moveTo({x:1, y:2})`.
//  Robots cannot move to a position occupied by red's robot.
//
// 2. robot.collect()
//  The robot will attempt to pickup a charge on the ground.
//  If successful, it will increment the robot.charges.
//
// 3. robot.clone()
//  If the robot has 3 or more charges, spend 2 to create a new robot.
//  There is a maximum of 256 robots per player.
//
// 4. robot.attack(redRobot)
//  If your robot is next to another robot (including diagonal), it can
//  smite them and remove 1 charge from them. If a robot reaches 0 charges,
//  it drops dead.
//
// You win when one of your robots is on red's flag.
// Change the `play` function so it handles any state and gives instructions
// to your robots to move, collect charges, clone, attack and defend, and
// ultimately capture red's flag.
