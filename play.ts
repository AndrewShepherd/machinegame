
//                   ---===≡≡≡ machinegame ≡≡≡===---

interface Point {
  x: number;
  y: number;
}

interface EnemyRobot extends Point {
  charges: number;
}

interface Robot extends Point {
  moveTo(pos: Point) : void;
  clone() : void;
  collect(): void;
  attack(enemy: EnemyRobot) : void;
  charges: number;
}


interface GameState {
  robots: Robot[];
  charges: Point[];
  red: {
    robots: EnemyRobot[];
    flag: Point;
  }
}

function proximity(l:Point, r:Point) {
  const h = Math.abs(l.x - r.x);
  const v = Math.abs(l.y - r.y);
  return Math.max(h, v);
}

function comparePoints(l:Point, r:Point) {
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
  
  let unexploredLocations : Point[] = [];
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

  function markAsExplored(locations: Point[]) {
    const millisecondsStart = Date.now();
    locations.sort(comparePoints);
    
    let minPossibleValue = 0;
    let indexesToDelete:number[] = [];
    let lastLocation: Point = undefined;
    for(let l of locations) {
      if(lastLocation && lastLocation.x == l.x && lastLocation.y == l.y) {
        continue;
      }
      let maxPossibleValue = unexploredLocations.length - 1;
      let found = false;
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
    
    let totalRemoved = 0;
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
  
  function getNext(count:number) {
    return unexploredLocations.slice(0, count);
  }
  
  return {
    markAsExplored: markAsExplored,
    getNext: getNext
  }
  
})();

class ChargeRegister {
  private knownCharges: Point[] = [];

  public incorporate(charges:Point[]) {
    charges.sort(comparePoints);
    // TODO: make this much faster
    const toAdd = [];
    for(let c of charges) {
      let found = false;
      for(let kc of this.knownCharges) {
        if((kc.x == c.x) && (kc.y == c.y)) {
          found = true;
          break;
        }
      }
      if(!found) {
        toAdd.push(c);
      }
    }
    this.knownCharges = this.knownCharges.concat(toAdd);
    this.knownCharges.sort(comparePoints);
   };
   public getAll() {
    return this.knownCharges.slice();
  };
  public remove(chargeToRemove: Point) {
    for(let i = 0; i < this.knownCharges.length; ++i) {
      const thisCharge = this.knownCharges[i];
      if(thisCharge.x == chargeToRemove.x && thisCharge.y == chargeToRemove.y) {
        this.knownCharges.splice(i, 1);
        return;
      }
    }
  }
}

const chargeRegister = new ChargeRegister();

const getGuardPositions = (function() {
  const positions: Point[] = [];
    for(let x = -2; x <= 2; ++x) {
      for(let y = -2; y <= 2; ++y) {
        positions.push({x: x, y: y});
      }
    }
    positions.sort(comparePoints);
  return function(count:number) {
    let result:Point[] = [];
    while(result.length < count) {
      result = result.concat(positions.slice(0, count - result.length));
    }
    result = result.map(p => { return {x: p.x, y: p.y} });
    return result;
  }
})();

let enemyFlag:Point = undefined;



function guardedMoveTo(robot : Robot, pos: Point) {
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



interface RobotAndLocation {
  robot: Robot;
  location: Point;
}

interface ProximityEntry extends RobotAndLocation {
  proximity: number;
}

type AssignmentFunction = (r:Robot, p: Point) => boolean;

function assignRobotsToLocations(
  availableRobots:Robot[],
  locations: Point[],
  doAssignment? : AssignmentFunction
  ) : number {
  let proximities:ProximityEntry[] = [];
  availableRobots.sort(comparePoints);
  locations.sort(comparePoints);
  
  const assignments:RobotAndLocation[] = [];
  
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
  let assignmentCount = 0;
  for(let a of assignments) {
    ++assignmentCount;
    availableRobots.splice(availableRobots.indexOf(a.robot), 1);
    locations.splice(locations.indexOf(a.location), 1);
    if(!doAssignment(a.robot, a.location)) {
      break;
    }
  }
  return assignmentCount;
}

function play(state : GameState) {
  ++iteration;
  const millisecondsStart = Date.now();
  console.log(`${iteration}: Starting iteration ${iteration}`);
  
  const availableRobots = state.robots.filter(r => !!r);
  const countOfAllRobots = availableRobots.length;
  const locationsOccupied = [];
  for(let r of availableRobots) {
    for(let dx = -4; dx <= 4; ++dx) {
      for(let dy = -4; dy <= 4; ++dy) {
        locationsOccupied.push({
          x: r.x + dx,
          y: r.y + dy
        });
      }
    }
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

     for(let r of availableRobots) {
       guardedMoveTo(r, enemyFlag);
     }
     availableRobots.splice(0, availableRobots.length)
   }


   // Miners, guards and explorers
   let availableMiners = Math.ceil(availableRobots.length / 2);


   
   const chargedUpRobots = availableRobots.filter(r => r.charges >= 3);
   const robotLimit = 250;
   let allowableRobots = robotLimit - countOfAllRobots;
   for(let r of chargedUpRobots) {
     if(--allowableRobots > 0) {
       r.clone();
       availableRobots.splice(availableRobots.indexOf(r), 1);
       --availableMiners;
     } else {
       console.log(`${iteration}: Not cloning robots as we have too many!`);
       break;
     }
   }
   
  const availableGuards = Math.ceil((availableRobots.length - availableMiners)/2);
   const availableExplorers = Math.max(0, availableRobots.length - availableMiners - availableGuards);
   
   
   if(availableGuards > 0) {
     const guardLocations = getGuardPositions(availableGuards);
     assignRobotsToLocations(availableRobots, guardLocations);
     console.log(`${iteration}: [${Date.now()-millisecondsStart}] Assigned ${availableGuards} guards`);
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
  console.log(`${iteration}: [${Date.now()-millisecondsStart}] Assigned ${assignedMiners} miners`);

   // Go into explorer mode
   if(availableRobots.length) {
     const timeSoFar = Date.now()-millisecondsStart;
     if(timeSoFar < 50) {
      const locationsToVisit = locationProvider.getNext(availableRobots.length);
      console.log(`${iteration}: first exploration location is (${locationsToVisit[0].x}, ${locationsToVisit[0].y})`);
      const assignmentCount = assignRobotsToLocations(availableRobots, locationsToVisit);   
      console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${assignmentCount} explorers`);

     } else {
       console.log(`${iteration}: ${timeSoFar} Not assigning explorers as there isn't enout time`);
     }
   }   
  
     const millisecondsEnd = Date.now();

   console.log(`${iteration}: [${millisecondsEnd - millisecondsStart}] Returning from the method.`);
}


