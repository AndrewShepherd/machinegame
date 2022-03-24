
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
    let knownChargeIndex = 0;


    // TODO: make this much faster
    const toAdd = [];
    for(let c of charges) {
      let found = false;
      while(knownChargeIndex < this.knownCharges.length) {
        const compareResult = comparePoints(c, this.knownCharges[knownChargeIndex]);
        if(compareResult == 0) {
          found = true;
          break;
        }
        if(compareResult < 1) {
          break;
        }
        ++knownChargeIndex;
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
  const positions: Point[] = [{x: 0, y: 0}];
/*    for(let x = -1; x <= 1; ++x) {
      for(let y = -1; y <= 1; ++y) {
        positions.push({x: x, y: y});
      }
    }
    positions.sort(comparePoints);
    */
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



interface RobotAndLocation<T extends Point> {
  robot: Robot;
  location: T;
}

interface ProximityEntry<T extends Point> extends RobotAndLocation<T> {
  proximity: number;
}

type AssignmentFunction<T extends Point> = (r:Robot, p: T) => boolean;

function assignRobotsToLocations<T extends Point>(
  availableRobots:Robot[],
  locations: T[],
  doAssignment? : AssignmentFunction<T>
  ) : number {
  let proximities:ProximityEntry<T>[] = [];
  availableRobots.sort(comparePoints);
  locations.sort(comparePoints);
  
  const assignments:RobotAndLocation<T>[] = [];
  
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

namespace Battle {

  interface OccupiedPosition {
    position: Point;
    enemies: EnemyRobot[]
  }

  interface EnemyNode {
    occupiedPosition: OccupiedPosition;
    assignedRobots: Robot[];
  }

  interface Move {
    robot: Robot;
    location: Point;
  }

  interface Attack {
    robot: Robot;
    enemy: EnemyRobot;
  }

  export interface BattlePlan {
    moves: Move[];
    attacks: Attack[];
  }
  
  export class BattlePlanner {

    public constructor(private readonly state: GameState) {
    }

    private static emptyPlan: BattlePlan = {
      attacks: [],
      moves: []
    };
  
    public generatePlan(): BattlePlan {
      const timeAtStart = Date.now();
      const sortedEnemy = this.state.red.robots.slice();
      sortedEnemy.sort(comparePoints);
      if(sortedEnemy.length) {
        console.log(`*** There is ${sortedEnemy.length} enemy ***`);
      } else {
        return BattlePlanner.emptyPlan;
      }

      // Get a list of occupied positions
      let occupiedPositions:OccupiedPosition[] = [{
        position: {x: sortedEnemy[0].x, y: sortedEnemy[0].y},
        enemies: [
          sortedEnemy[0]
        ]
      }];
      for(let i = 1; i < sortedEnemy.length; ++i) {
        const e = sortedEnemy[i];
        const last = occupiedPositions[occupiedPositions.length - 1];
        if((e.x == last.position.x) && (e.y == last.position.y)) {
          last.enemies.push(e);
        } else {
          occupiedPositions.push({
            enemies: [e],
            position: {x: e.x, y: e.y}
          });
        }
      }
      console.log(`*** There are ${occupiedPositions.length} unique enemy positions ***`);
      // Ignore them if they are too far away
      occupiedPositions = occupiedPositions.filter(p => p.position.x < 50 && p.position.y < 50);


      const nodes:EnemyNode[] = occupiedPositions.map(
        r => { 
          return {
            assignedRobots: [],
            occupiedPosition: r
          };
        }
      );

      let robotsAndNodes:{ robot: Robot, node: EnemyNode, proximity: number }[] = [];
      for(let r of this.state.robots) {
        for(let n of nodes) {
          robotsAndNodes.push(
            { 
              robot: r,
              node: n,
              proximity: proximity(r, n.occupiedPosition.position)
            }
          );          
        }
      }
      robotsAndNodes.sort(
        (l, r) => l.proximity < r.proximity ? 1 : (l.proximity > r.proximity ? -1 : 0)
      );
      const plan:BattlePlan = {
        moves: new Array<Move>(),
        attacks: new Array<Attack>()
      };

      console.log(`Battle plan handing ${robotsAndNodes.length} robots and nodes. Time = ${Date.now() - timeAtStart}`);
      if(robotsAndNodes.length > 500) {
        robotsAndNodes = robotsAndNodes.slice(0, 500);
      }
      let totalAssignedRobots = 0;
      while(robotsAndNodes.length) {
        const e = robotsAndNodes.pop();
        if((e.proximity > 1) && (this.state.robots.length - totalAssignedRobots < 10)) {
          console.log('Battle Plan leaving some non-fighting robots!');
          break;
        }
        // Has too much time past?
        if(Date.now() - timeAtStart > 20) {
          console.log('Battle Plan terminating early as too much time has past!');
          break;
        }
        ++totalAssignedRobots;
        e.node.assignedRobots.push(e.robot);

        const totalEnemyCharges = e.node.occupiedPosition.enemies.map(e => e.charges).reduce((l, r) => l+r);
        const totalRobotCharges = e.node.assignedRobots.map(r => r.charges).reduce((l, r) => l+r);
        const enemyIsBeaten = totalRobotCharges > totalEnemyCharges * 2;
        const indexesToDelete: number[] = [];
        for(let i = 0; i < robotsAndNodes.length; ++i) {
          const rn = robotsAndNodes[i];
          if( (rn.robot === e.robot) || (enemyIsBeaten && (rn.node === e.node))) {
            indexesToDelete.push(i);
          }
        }
        for(let i = indexesToDelete.length - 1; i >= 0; --i) {
          robotsAndNodes.splice(indexesToDelete[i], 1);
        }
      }
      // Now we have assigned robots to positions!
      // Next we decide which ones move, which ones attack
      for(let n of nodes) {
        let attackingRobots:Robot[] = [];
        const movingRobots:Robot[] = [];
        const hesitantRobots:Robot[] = [];
        for(let r of n.assignedRobots) {
          const p = proximity(r, n.occupiedPosition.position);
          if(p == 1) {
            attackingRobots.push(r);
          } else if (p == 2) {
            hesitantRobots.push(r);
          } else {
            movingRobots.push(r);
          }
        }
        
        // Decide if the hesitant robots should attack
        // or start hesitant
        const totalAttack = hesitantRobots
          .map(r => r.charges)
          .reduce((l,r) => l+r, 0) 
          + attackingRobots.map(r => r.charges).reduce((l, r) => l+r, 0);
        const totalDefence = n.occupiedPosition.enemies.map(r => r.charges).reduce((l, r) => l+r);
        if(totalAttack > totalDefence*2) {
          attackingRobots = attackingRobots.concat(hesitantRobots);
        } else {
          if(hesitantRobots.length) {
            console.log(`${hesitantRobots.length} robots looking at position (${n.occupiedPosition.position.x}, ${n.occupiedPosition.position.y}). Not moving in yet`);
          }
          for(let h of hesitantRobots) {
            plan.moves.push({ robot: h, location: h});
          }
        }
        for(let r of movingRobots) {
          plan.moves.push({ robot: r, location: n.occupiedPosition.position});
        }
        let enemyIndex = 0;
        let enemyDamage = 0;
        for(let r of attackingRobots) {
          const enemy = n.occupiedPosition.enemies[enemyIndex % n.occupiedPosition.enemies.length];
          plan.attacks.push({ robot: r, enemy: enemy });
          if(++enemyDamage >= enemy.charges) {
            ++enemyIndex;
            enemyDamage = 0;
          }
        }
      }
      return plan;
    } 
  }
}




function play(state : GameState) {
  ++iteration;
  const millisecondsStart = Date.now();
  console.log(`${iteration}: Starting iteration ${iteration}`);
  
  let availableRobots:Robot[] = state.robots.filter(r => !!r);
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


  enemyFlag = enemyFlag || state.red.flag;
  const battlePlanner = new Battle.BattlePlanner(state);
  const plan = battlePlanner.generatePlan();
  for(let a of plan.attacks) {
    a.robot.attack(a.enemy);
    availableRobots.splice(availableRobots.indexOf(a.robot), 1);
  }
  for(let a of plan.moves) {
    a.robot.moveTo(a.location);
    availableRobots.splice(availableRobots.indexOf(a.robot), 1);
  }
  console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${plan.attacks.length} attacks.`);
  console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${plan.moves.length} robots to move towards enemies.`);


  
  if(enemyFlag) {
    // Send a robot to it
    assignRobotsToLocations(
      availableRobots,
      [enemyFlag]
    );
   }


   // Miners, guards and explorers
   let availableMiners = Math.ceil(availableRobots.length * 2 / 3);


   
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
   

  const explorerAndGuardLocations = locationProvider.getNext(availableExplorers)
    .concat(getGuardPositions(availableGuards));
   const assignmentCount = assignRobotsToLocations(availableRobots, explorerAndGuardLocations);
   console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${assignmentCount} guardsAndLocations.`);
   


   let availableMines = chargeRegister.getAll();
    
    const allowableRovingMiners = Math.ceil(availableMiners/2);
    const allowableCloseMiners = availableMiners - allowableRovingMiners;
    let assignedMiners = 0;

    const assignedRovingMiners = assignRobotsToLocations(
        availableRobots,
        availableMines,
        (robot, location) => {
            if (robot.x == location.x && robot.y == location.y) {
                robot.collect();
                chargeRegister.remove(location);
            }
            else {
                robot.moveTo(location);
            }
            return (++assignedMiners < allowableRovingMiners);
        }
    );
    console.log(`${iteration}: [${Date.now()-millisecondsStart}] Assigned ${assignedRovingMiners} roving miners`);



    if (availableMines.length > allowableCloseMiners) {
        availableMines.sort((a, b) => {
            const da = (a.x * a.x + a.y * a.y);
            const db = (b.x * b.x + b.y * b.y);
            if (da < db) {
                return -1;
            }
            if (da > db) {
                return 1;
            }
            return 0;
        });
        availableMines = availableMines.slice(0, availableRobots.length);
    }
    const assignedCloseMiners = assignRobotsToLocations(availableRobots, availableMines, 
        (robot, location) => {
        if (robot.x == location.x && robot.y == location.y) {
            robot.collect();
            chargeRegister.remove(location);
        }
        else {
            robot.moveTo(location);
        }
        return true;
    });
  console.log(`${iteration}: [${Date.now()-millisecondsStart}] Assigned ${assignedCloseMiners} close miners`);

   // If there are any robots left (more miners than mines) send them exploring
   if(availableRobots.length) {
     const timeSoFar = Date.now()-millisecondsStart;
     if(timeSoFar < 50) {
      const locationsToVisit = locationProvider.getNext(availableRobots.length);
      if(locationsToVisit.length) {
        const firstLocation = locationsToVisit[0];
        const assignmentCount = assignRobotsToLocations(availableRobots, locationsToVisit);   
        console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${assignmentCount} additional explorers. First location is (${firstLocation.x}, ${firstLocation.y})`);  
      } else {
        if(enemyFlag) {
          for(let r of availableRobots) {
            r.moveTo({ x: enemyFlag.x + 3, y: enemyFlag.y + 3 });
          }
        }
      }

     } else {
       console.log(`${iteration}: ${timeSoFar} Not assigning explorers as there isn't enout time`);
     }
   }   
  
     const millisecondsEnd = Date.now();

   console.log(`${iteration}: [${millisecondsEnd - millisecondsStart}] Returning from the method.`);
}


