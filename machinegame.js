
//                   ---===≡≡≡ machinegame ≡≡≡===---

// Your goal is to capture the red player's flag with your army of robots.
// The flag will be defended by red's robots.
function proximity(l, r) {
  const h = Math.abs(l.x - r.x);
  const v = Math.abs(l.y - r.y);
  return Math.max(h, v);
}

function comparePoints(l, r) {
    if((l.x === r.x) && (l.y === r.y)) {
      return 0;
    }
    const dL = Math.max(Math.abs(l.x), Math.abs(l.y));
    const dR = Math.max(Math.abs(r.x), Math.abs(r.y));
    if(dL < dR) {
      return -1;
    } else if (dL > dR) {
      return 1;
    }
    // The top row
    if(l.y === (0 - dL)) {
      if(r.y === (0-dL)) {
        return l.x < r.x ? -1 : 1;
      } else {
        return -1;
      }
    } 
    if(r.y === (0-dL)) {
      return 1;
    }
    // The right side
    if(l.x === dL) {
      if(r.x === l.x) {
        return l.y < r.y ? -1 : 1;
      } else {
        return -1;
      }
    }
    if(r.x === dL) {
      return 1;
    }
    // The bottom
    if(l.y === dL) {
      if(r.y == l.y) {
        return l.x > r.x ? -1 : 1; // Not an error
      } else {
        return -1;
      }
    }
    return l.y > r.y ? -1 : 1;
  }




let iteration = 0;


const locationProvider = (function() {
  
  console.log('Initializing the location provider');
  
  let unexploredLocations = [];
  for(let distance = 1; distance < 50; distance += 1) {
    for(let x = 0-distance; x <= distance; ++x) {
      unexploredLocations.push({ x: x, y: 0-distance });
    }
    for(let y = 0-distance+1; y <= distance; ++y) {
      unexploredLocations.push({x:distance, y: y});
    }
    for(let x = distance-1; x >= 0-distance; --x) {
      unexploredLocations.push({x: x, y: distance});
    }
    for(let y = distance-1; y > 0-distance; --y) {
      unexploredLocations.push({x: 0-distance, y: y});
    }
  }
  unexploredLocations.sort(comparePoints);

  function markAsExplored(locations) {
    const millisecondsStart = Date.now();
    locations.sort(comparePoints);
    
    /*
    console.log("*** Going to attempt to remove the following locations");
    for(let l of locations) {
      console.log(`   (${l.x}, ${l.y})`);
    }
    */
    
    // TODO: Binary search!
    let minPossibleValue = 0;
    let indexesToDelete = [];
    for(let l of locations) {
      maxPossibleValue = unexploredLocations.length - 1;
      found = false;
      while(minPossibleValue <= maxPossibleValue) {
        const midPoint = Math.floor((minPossibleValue + maxPossibleValue)/2);
        const comparison = comparePoints(l, unexploredLocations[midPoint]);
        if(comparison < 0) {
          maxPossibleValue = midPoint - 1;
        } else if (comparison > 0) {
          minPossibleValue = midPoint + 1;
        } else {
          //console.log(`Going to delete location ${l.x}, ${l.y} at index ${midPoint}`);
          indexesToDelete.push(midPoint);
          found = true;
          break;
        }
      }
    }
    
    totalRemoved = 0;
    if(indexesToDelete.length > 0) {
      let lastValue = indexesToDelete.pop();
      unexploredLocations.splice(lastValue, 1);
      while(indexesToDelete.length > 0) {
        const value = indexesToDelete.pop();
        if(value != lastValue) {
          unexploredLocations.splice(value, 1);
          lastValue = value;
          ++totalRemoved;
        }
      }
    }

    const millisecondsEnd = Date.now();
    console.log(`markAsExplored. Processing ${locations.length} locations and removed ${totalRemoved}. Unexplored Locations Length = ${unexploredLocations.length}. Milliseconds Taken: ${millisecondsEnd - millisecondsStart}`);
  }
  
  function getNext(count) {
    return unexploredLocations.slice(0, count);
  }
  
  return {
    markAsExplored: markAsExplored,
    getNext: getNext
  }
  
})();


const chargeRegister = (function() {

  let knownCharges = [];
  
  return {
   incorporate: function(charges) {
    charges.sort(comparePoints);
    // TODO: make this much faster
    const toAdd = [];
    for(let c of charges) {
      let found = false;
      for(let kc of knownCharges) {
        if((kc.x == c.x) && (kc.y == c.y)) {
          found = true;
          break;
        }
      }
      if(!found) {
        toAdd.push(c);
      }
    }
    knownCharges = knownCharges.concat(toAdd);
    knownCharges.sort(comparePoints);
   },
   getAll: function() {
     return knownCharges.slice();
   },
   remove: function(chargeToRemove) {
     for(let i = 0; i < knownCharges.length; ++i) {
       const thisCharge = knownCharges[i];
       if(thisCharge.x == chargeToRemove.x && thisCharge.y == chargeToRemove.y) {
         knownCharges.splice(i, 1);
         return;
       }
     }
   }
  }
})();


const getGuardPositions = (function() {
  const positions = [
    {x: -1, y: -1},
    {x: 1, y: 1 },
    {x: -1, y: 1},
    {x: 1, y: -1 },
    {x: -3, y: -3 },
    {x: 3, y: 3 },
    {x: -3, y: 3 },
    {x: 3, y: -3 },
    {x: 0, y: 1 },
    {x: 0, y: -1 },
    {x: 1, y: 0 },
    {x: -1, y: 0 },
    {x: 3, y: 0 },
    {x: -3, y : 0 },
    {x: 0, y: -3 },
    {x: 0, y:  3 },
    {x: 4, y: 4 },
    {x: 4, y: -4 },
    {x: -4, y: 4 },
    {x: -4, y: -4 },
    {x: -4, y: 0 },
    {x: 4, y: 0 },
    {x: 0, y: 4 },
    {x: 0, y: -4 }
  ];
  return function(count) {
    result = [];
    while(result.length < count) {
      result = result.concat(positions.slice(0, count - result.length));
    }
    result = result.map(p => { return {x: p.x, y: p.y} });
    return result;
  }
})();

let enemyFlag = undefined;

function guardedMoveTo(robot, pos) {
  if(robot.x == pos.x && robot.y == pos.y) {
    return;
  }
  try {
    //console.log(`Moving robot at (${robot.x}, ${robot.y}) to (${pos.x}, ${pos.y})`);
    robot.moveTo(pos);
    //console.log(`Returned from robot.moveTo`);
  } catch(e) {
    console.error(`Error when invoking robot.moveTo`);
    console.error(e);
  }
}

function assignRobotsToLocations(availableRobots, locations, doAssignment) {
  let proximities = [];
  availableRobots.sort(comparePoints);
  locations.sort(comparePoints);
  
  const assignments = [];
  
  for(let r of availableRobots) {
    let quickAssignment = undefined;
    for(let l of locations) {
      const prox = proximity(r, l);
      if(prox === 0) {
        const assignment = { robot: r, location: l};
        assignments.push(assignment);
        proximities = proximities.filter(entry => (entry.robot !== r) && (entry.location !== l));
        quickAssignment = assignment;
        break;
      }
      else {
        proximities.push({
          robot: r,
          location: l,
          proximity: prox
        });
      }
    }
    if(quickAssignment) {
      locations.splice(locations.indexOf(quickAssignment.location), 1);
    }
  }
  proximities.sort(
    (l, r) => {
      if(l.proximity < r.proximity) {
        return 1;
      } else if (l.proximity > r.proximity) {
        return -1;
      } else {
        return 0;
      }
    }
  );
  while(proximities.length) {
    const p = proximities.pop();
    assignments.push({ robot: p.robot, location: p.location });
    proximities = proximities.filter(prox => prox.robot != p.robot && prox.location != p.location);
  }
  
  doAssignment = doAssignment || function(robot, location) { 
    robot.moveTo(location);
    return true;
  }; 
  for(a of assignments) {
    availableRobots.splice(availableRobots.indexOf(a.robot), 1);
    locations.splice(locations.indexOf(a.location), 1);
    if(!doAssignment(a.robot, a.location)) {
      break;
    }
  }
}

function play(state) {
  ++iteration;
  const millisecondsStart = Date.now();
  console.log(`${iteration}: Starting iteration ${iteration}`);
  
  const availableRobots = state.robots.filter(r => !!r);
  const countOfAllRobots = availableRobots.length;
  const locationsOccupied = [];
  for(let r of availableRobots) {
    locationsOccupied.push(r);
    locationsOccupied.push({x: r.x - 1, y:r.y});
    locationsOccupied.push({x: r.x + 1, y:r.y});
    locationsOccupied.push({x: r.x, y:r.y - 1});
    locationsOccupied.push({x: r.x, y:r.y + 1});
    locationsOccupied.push({x: r.x -1, y:r.y-1});
    locationsOccupied.push({x: r.x+1, y:r.y+1});
    locationsOccupied.push({x:r.x-1, y:r.y+1});
    locationsOccupied.push({x:r.x-1, y:r.y-1});
  }
  locationProvider.markAsExplored(locationsOccupied);
  

   chargeRegister.incorporate(state.charges.filter(c => !!c));

   if(state.red.robots.length) {
     console.log(`${iteration}: Found enemy! ${state.red.robots.length} enemy robots`);

     let i = 0;
     let totalAttackers = 0;
     while(state.red.robots.length && availableRobots.length) {
       const enemy = state.red.robots[i];
       let closestRobot = undefined;
       let closestProximity = 100000;
       for(let r of availableRobots) {
         const p = proximity(r, enemy);
         if(p < closestProximity) {
           closestRobot = r;
           closestProximity = p;
         }
       }
       if(closestRobot) {
         if(closestProximity <= 1) {
           console.log(`${iteration}: Robot at (${closestRobot.x}, ${closestRobot.y} attacking enemy at ${enemy.x}, ${enemy.y}`);
           closestRobot.attack(enemy);
           console.log(`Returned from robot.attack(...)`);
         } else if (closestProximity == 2) {
            console.log(`${iteration}: Robot at (${closestRobot.x}, ${closestRobot.y} is 2 away from ${enemy.x}, ${enemy.y}`);
         }
        else {
           guardedMoveTo(closestRobot, enemy);
         }
         
         availableRobots.splice(availableRobots.indexOf(closestRobot), 1);
       }
       else {
        console.error(`Closest robot is falsy!`);
      }
      enemy.charges = enemy.charges - closestRobot.charges
      console.log(`enemy.charges now equals ${enemy.charges}`);
      if(enemy.charges > 0) {
        if(state.red.robots.length) {
          i = (i+1)%state.red.robots.length;
        }
      } else {
        state.red.robots.splice(state.red.robots.indexOf(enemy), 1);
        if(state.red.robots.length) {
          i = i%state.red.robots.length;
        }
      }
       ++totalAttackers;
     } 
   }
   
   
   
  enemyFlag = enemyFlag || state.red.flag;
  if(enemyFlag) {
      console.log(`${iteration}: Found flag at (${enemyFlag.x}, ${enemyFlag.y})`)

     for(var r of availableRobots) {
       guardedMoveTo(r, enemyFlag);
     }
     availableRobots.splice(0, availableRobots.length)
   }
   
   const chargedUpRobots = availableRobots.filter(r => r.charges >= 3);
   const robotLimit = 175;
   let allowableRobots = robotLimit - countOfAllRobots;
   for(let r of chargedUpRobots) {
     if(--allowableRobots > 0) {
       r.clone();
       availableRobots.splice(availableRobots.indexOf(r), 1);
     } else {
       console.log(`${iteration}: Not cloning robots as we have too many!`);
       break;
     }
   }
   
   // Miners, guards and explorers
   const availableMiners = Math.ceil(availableRobots.length / 2);
   const availableGuards = Math.ceil((availableRobots.length - availableMiners)/2);
   const availableExplorers = Math.max(0, availableRobots.length - availableMiners - availableGuards);
   
   if(availableGuards > 0) {
     console.log(`${iteration}: ${Date.now()-millisecondsStart} assigning ${availableGuards} guards`);
     const guardLocations = getGuardPositions(availableGuards);
     assignRobotsToLocations(availableRobots, guardLocations);
     console.log(`${iteration}: ${Date.now()-millisecondsStart} completed assigning guards`);
   }

   
   let assignedMiners = 0;
   
   assignRobotsToLocations(
     availableRobots,
     chargeRegister.getAll(),
     (robot, location) => {
      if(robot.x == location.x && robot.y == location.y) {
        robot.collect();
        chargeRegister.remove(location);
      } else {
        robot.moveTo(location);
      }
      return (++assignedMiners < availableMiners);
     }
  );
   

   // Go into explorer mode
   if(availableRobots.length) {
     const timeSoFar = Date.now()-millisecondsStart;
     if(timeSoFar < 50) {
       console.log(`${iteration}: ${Date.now()-millisecondsStart} assigning exploration locations to ${availableRobots.length} robots`);
      const locationsToVisit = locationProvider.getNext(availableRobots.length);
      assignRobotsToLocations(availableRobots, locationsToVisit);   
     } else {
       console.log(`${iteration}: ${timeSoFar} Not assigning explorers as there isn't enout time`);
     }
   }   
  
     const millisecondsEnd = Date.now();

   console.log(`${iteration}: Returning from the method. Milliseconds = ${millisecondsEnd - millisecondsStart}`);
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






// ------------------ previous code

// 
// function proximity(l, r) {
//   return Math.abs(l.x - r.x) + Math.abs(l.y - r.y);
// }
// 
// function play(state) {
// 


//   for(let r of availableRobots) {
//       var randomPoint = {
//         x: Math.round(Math.random() * 48 - 24),
//         y: Math.round(Math.random() * 48 - 24),
//       }
//       r.moveTo(randomPoint)  
//   }
// 
// 
// }
// 
// 
// 
// 
// 
// 
// // ------------------ previous code
// 
// // 
// // function play(state) {
// //   var robot = state.robots[0];
// //   var flag = state.red.flag;
// //   
// //   robot.moveTo(flag);
// // 
// // }
// // 
