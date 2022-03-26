
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
  
  // console.log('Initializing the location provider');
  
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
    // console.log(`markAsExplored. Processing ${locations.length} locations and removed ${totalRemoved}. Unexplored Locations Length = ${unexploredLocations.length}. Milliseconds Taken: ${millisecondsEnd - millisecondsStart}`);
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

  enum PositionType { Normal, EnemyFlag}

  interface TargetPosition {
    position: Point;
    positionType: PositionType;
    enemies: EnemyNode[]
    assignedRobots: RobotNode[];
  }

  interface FriendlyPosition {
    position: Point;
    robots: RobotNode[]
  }

  interface EnemyNode {
    occupiedPosition: TargetPosition;
    enemy: EnemyRobot;
  }

  interface RobotNode {
    position: FriendlyPosition;
    assignedAttack?: TargetPosition;
    robot: Robot;
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
    stayPuts: Robot[];
  }
  
  export class BattlePlanner {

    public constructor(private readonly state: GameState) {
    }

    private static emptyPlan: BattlePlan = {
      attacks: [],
      moves: [],
      stayPuts: []
    };
  
    // Ways to improve this:

    // Incorporate guarding the flag
    // It there are more than 4 robots, 
    // there must be a portion that sit at
    // point (0, 0) and just not move
    // under any circumstances
    //
    // Attack the enemy flag even if there
    // are no enemy on it
    //
    // If there are too many friendly positions
    // consolidate them

    //
    // Build a graph
    //
    // FriendlyLocation <= One-To-May => RobotNodes <= ZeroOrOne to ZeroOrOne => EnemyNode <= Many to One => EnemyLocation
    public generatePlan(): BattlePlan {
      const timeAtStart = Date.now();
      const sortedEnemy = this.state.red.robots.slice();
      sortedEnemy.sort(comparePoints);
      if(sortedEnemy.length) {
        // console.log(`*** There is ${sortedEnemy.length} enemy ***`);
      } else {
        return BattlePlanner.emptyPlan;
      }

      // Get a list of occupied positions
      let occupiedPositions:TargetPosition[] = [];
      // console.log(`Consolidating ${sortedEnemy.length} enemy`);

      const isRedFlag = (p:Point) =>
        this.state.red.flag && (this.state.red.flag.x === p.x) && (this.state.red.flag.y === p.y);

      let enemyFlagNode: TargetPosition = undefined;
      for(let i = 0; i < sortedEnemy.length; ++i) {
        const e = sortedEnemy[i];
        const last:TargetPosition = occupiedPositions.length ? occupiedPositions[occupiedPositions.length- 1] : undefined;

        if((last !== undefined) && (e.x == last.position.x) && (e.y == last.position.y)) {
          const enemyNode: EnemyNode = {
            enemy: e,
            occupiedPosition: last
          };
          last.enemies.push(enemyNode);
        } else {
          const occupiedPositionNode: TargetPosition = {
            assignedRobots: [],
            enemies: [],
            position: {x: e.x, y: e.y},
            positionType: PositionType.Normal
          };
          if(!enemyFlagNode && isRedFlag(e)) {
            enemyFlagNode = occupiedPositionNode;
            occupiedPositionNode.positionType = PositionType.EnemyFlag;
          }
          const enemyNode: EnemyNode = {
            enemy: e,
            occupiedPosition: occupiedPositionNode
          }
          occupiedPositionNode.enemies.push(enemyNode);
          occupiedPositions.push(occupiedPositionNode);
        }
      }
      if(!enemyFlagNode && this.state.red.flag) {
        enemyFlagNode = {
          assignedRobots: [],
          enemies: [],
          position: this.state.red.flag,
          positionType: PositionType.EnemyFlag
        };
        occupiedPositions.push(enemyFlagNode);
      }
      // console.log(`*** There are ${occupiedPositions.length} unique enemy positions ***`);

      // Create a list of friendly position nodes
      const sortedRobots = this.state.robots.slice();
      sortedRobots.sort(comparePoints);
      let friendlyPositions:FriendlyPosition[] = [];
      for(let i = 1; i < sortedRobots.length; ++i) {
        const e = sortedRobots[i];
        const last = friendlyPositions.length ? friendlyPositions[friendlyPositions.length - 1]: undefined;
        if(last && (e.x == last.position.x) && (e.y == last.position.y)) {
          const robotNode: RobotNode = {
            position:last,
            assignedAttack: undefined,
            robot: e
          };
          last.robots.push(robotNode);
        } else {
          const friendlyPosition:FriendlyPosition = {
            position: e,
            robots: []
          };
          const robotNode: RobotNode = {
            position: friendlyPosition,
            robot: e
          };
          friendlyPosition.robots.push(robotNode);
          friendlyPositions.push(friendlyPosition);
        }
      }
      // console.log(`*** We have ${sortedRobots.length} robots in ${friendlyPositions.length} positions ***`);

      let crossRef:{ friendlyPosition: FriendlyPosition, enemyPosition: TargetPosition, proximity: number }[] = [];
      for(let fp of friendlyPositions) {
        for(let ep of occupiedPositions) {
          const p = proximity(fp.position, ep.position);

          if(this.state.red.flag) {
            if((ep.positionType === PositionType.Normal) && (p > 2)) {
              // This is just noise. We need to capture the flag!
              continue;
            }
          } else {
            if ((this.state.robots.length > 100) && (p > 3)) {
              // We can't deal with too much
              continue; 
            }
          }
          crossRef.push(
            { 
              friendlyPosition: fp,
              enemyPosition: ep,
              proximity: p
            }
          );          
        }
      }
      crossRef.sort(
        (l, r) => {
          if (l.proximity < r.proximity) {
            return -1;
          } else if (l.proximity > r.proximity) {
            return 1;
          } else if (l.enemyPosition.positionType === PositionType.EnemyFlag) {
            return r.enemyPosition.positionType === PositionType.EnemyFlag ? 0 : -1;
          } else if (r.enemyPosition.positionType === PositionType.EnemyFlag) {
            return 1;
          } else {
            return 0;
          }
        }
      );

      // console.log(`Battle plan handing ${crossRef.length} robots and nodes. Time = ${Date.now() - timeAtStart}`);
      if(crossRef.length > 500) {
        crossRef = crossRef.slice(0, 500);
      }
      let totalAssignedRobots = 0;
      for(let i = 0; i < crossRef.length; ++i) {
        const e = crossRef[i];
        if(!e) {
          // This is normal. Items get deleted
          continue; 
        }
        if((e.proximity > 1) && (this.state.robots.length - totalAssignedRobots < 10)) {
          // console.log('Battle Plan leaving some non-fighting robots!');
          break;
        }
        // Has too much time past?
        if(Date.now() - timeAtStart > 20) {
          console.log('Battle Plan terminating early as too much time has past!');
          break;
        }

        // console.log(`Assigning attackers from (${e.friendlyPosition.position.x}, ${e.friendlyPosition.position.y}) to (${e.enemyPosition.position.x}, ${e.enemyPosition.position.y}). Proximity = ${e.proximity}`);

        // How many are already attacking the enemy position
        const enemyCharges = e.enemyPosition.enemies.map(en => en.enemy.charges).reduce((l, r) => l+r, 0);
        let attackingCharges = e.enemyPosition.assignedRobots.map(ar => ar.robot.charges).reduce((l, r) => l+r, 0);

        // console.log(`--- Enemy Charges for this position: (${enemyCharges})`);
        let robotsAssignedThisRound = 0;
        for(let robot of e.friendlyPosition.robots) {
          if(robot.assignedAttack) {
            // console.log(`robot already assigned attack. Not reassigning`);
            continue;
          }
          ++robotsAssignedThisRound;
          robot.assignedAttack = e.enemyPosition;
          e.enemyPosition.assignedRobots.push(robot);
          attackingCharges += robot.robot.charges;
          if(attackingCharges > enemyCharges*2) {
            break;
          }
        }
        totalAssignedRobots += robotsAssignedThisRound;
        // console.log(`--- After assigning robots, attacking charges equals ${attackingCharges}`);
        const enemyIsBeaten = attackingCharges > enemyCharges * 2;
        const allRobotsAssigned = e.friendlyPosition.robots.every(rn => !!rn.assignedAttack);
        if(enemyIsBeaten || allRobotsAssigned) {
          for(let j = i+1; j < crossRef.length; ++j) {
            const rn = crossRef[j];
            if(!rn) {
              continue;
            }
            if(
              (allRobotsAssigned && (rn.friendlyPosition === e.friendlyPosition)) 
              || (enemyIsBeaten && (rn.enemyPosition === e.enemyPosition))
            ) {
              crossRef[j] = undefined;
            }
          }
        }
      }

      if(enemyFlagNode && this.state.robots.length > 200) {
        console.log("Rushing the flag!");
        // Fucking rush the thing!
        for(let fp of friendlyPositions) {
          for(let r of fp.robots) {
            if(!r.assignedAttack) {
              console.log(`Assigning robot at (${r.position.position.x}, ${r.position.position.y}))`);
              r.assignedAttack = enemyFlagNode;
              enemyFlagNode.assignedRobots.push(r);
            }
          }
        }
      }
      const plan:BattlePlan = {
        moves: new Array<Move>(),
        attacks: new Array<Attack>(),
        stayPuts: new Array<Robot>()
      };


      // Now we have assigned robots to positions!
      // Next we decide which ones move, which ones attack
      //for(let n of occupiedPositions) {
      for(let i = 0; i < occupiedPositions.length; ++i) {
        const n = occupiedPositions[i];
        const totalDefence = n.enemies.map(r => r.enemy.charges).reduce((l, r) => l+r, 0);
        if(n.positionType == PositionType.EnemyFlag) {
          console.log(`position (${n.position.x}, ${n.position.y}) we have ${n.assignedRobots.length} assigned robots to attack ${n.enemies.length} enemy with a total defence of ${totalDefence}`);
        }
        const attackingRobots:Robot[] = [];
        let movingRobots:Robot[] = [];
        const hesitantRobots:Robot[] = [];
        for(let r of n.assignedRobots) {
          const p = proximity(r.robot, n.position);
          if(p == 1) {
            attackingRobots.push(r.robot);
          } else if (p == 2) {
            hesitantRobots.push(r.robot);
          } else {
            movingRobots.push(r.robot);
          }
        }
        
        // Decide if the hesitant robots should attack
        // or start hesitant
        const totalAttack = hesitantRobots
          .map(r => r.charges)
          .reduce((l,r) => l+r, 0) 
          + attackingRobots.map(r => r.charges).reduce((l, r) => l+r, 0);
        if(n.positionType == PositionType.EnemyFlag) {
          //console.log(`total attack of robots within proximity of 2 is ${totalAttack}`);
          //console.log(`position (${n.position.x}, ${n.position.y}) There are ${n.enemies.length} enemy robots with a total defence of ${totalDefence}`);
        }
        if(totalAttack >= totalDefence*2) {
          movingRobots = movingRobots.concat(hesitantRobots);
        } else {
          if(hesitantRobots.length && (n.positionType == PositionType.EnemyFlag)) {
            //console.log(`${hesitantRobots.length} robots looking at position (${n.position.x}, ${n.position.y}). Not moving in yet`);
          }
          for(let h of hesitantRobots) {
            plan.stayPuts.push(h);
          }
        }
        for(let r of movingRobots) {
          plan.moves.push({ robot: r, location: n.position});
        }
        let enemyIndex = 0;
        let enemyDamage = 0;
        for(let r of attackingRobots) {
          if(n.enemies.length) {
            const enemy = n.enemies[enemyIndex % n.enemies.length];
            plan.attacks.push({ robot: r, enemy: enemy.enemy });
            if(++enemyDamage >= enemy.enemy.charges) {
              ++enemyIndex;
              enemyDamage = 0;
            }  
          } else {
            plan.moves.push({ robot: r, location: n.position });
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
  // console.log(`${iteration}: Starting iteration ${iteration}`);
  
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
  state.red.flag = state.red.flag || enemyFlag;
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
  for(let a of plan.stayPuts) {
    availableRobots.splice(availableRobots.indexOf(a), 1);
  }
  //console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${plan.attacks.length} attacks.`);
  //console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${plan.moves.length} robots to move towards enemies.`);


  
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
       // console.log(`${iteration}: Not cloning robots as we have too many!`);
       break;
     }
   }
   
  const availableGuards = Math.ceil((availableRobots.length - availableMiners)/2);
  const availableExplorers = Math.max(0, availableRobots.length - availableMiners - availableGuards);
   

  const explorerAndGuardLocations = locationProvider.getNext(availableExplorers)
    .concat(getGuardPositions(availableGuards));
   const assignmentCount = assignRobotsToLocations(availableRobots, explorerAndGuardLocations);
   // console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${assignmentCount} guardsAndLocations.`);
   


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
    // console.log(`${iteration}: [${Date.now()-millisecondsStart}] Assigned ${assignedRovingMiners} roving miners`);



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
  // console.log(`${iteration}: [${Date.now()-millisecondsStart}] Assigned ${assignedCloseMiners} close miners`);

   // If there are any robots left (more miners than mines) send them exploring
   if(availableRobots.length) {
     const timeSoFar = Date.now()-millisecondsStart;
     if(timeSoFar < 50) {
      const locationsToVisit = locationProvider.getNext(availableRobots.length);
      if(locationsToVisit.length) {
        const firstLocation = locationsToVisit[0];
        const assignmentCount = assignRobotsToLocations(availableRobots, locationsToVisit);   
        // console.log(`${iteration}: [${Date.now()-millisecondsStart}] assigned ${assignmentCount} additional explorers. First location is (${firstLocation.x}, ${firstLocation.y})`);  
      } else {
        if(enemyFlag) {
          for(let r of availableRobots) {
            r.moveTo({ x: enemyFlag.x + 3, y: enemyFlag.y + 3 });
          }
        }
      }

     } else {
       // console.log(`${iteration}: ${timeSoFar} Not assigning explorers as there isn't enout time`);
     }
   }   
  
     const millisecondsEnd = Date.now();

   // console.log(`${iteration}: [${millisecondsEnd - millisecondsStart}] Returning from the method.`);
}


