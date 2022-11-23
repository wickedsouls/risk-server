const throwDices = (attacker, defender) => {
  const newRandomNumbers = (amount) => {
    return new Array(amount)
      .fill(undefined)
      .map(() => {
        return Math.ceil(Math.random() * 6);
      })
      .sort((a, b) => (a > b ? -1 : 1));
  };
  const attackerRolls = newRandomNumbers(attacker);
  const defenderRolls = newRandomNumbers(defender);

  console.log('attackerRolls:', attackerRolls);
  console.log('defenderRolls:', defenderRolls);

  let attackerLeftover = attacker;
  let defenderLeftover = defender;
  defenderRolls.forEach((defenderValue, i) => {
    if (defenderValue >= attackerRolls[i]) attackerLeftover--;
    if (defenderValue < attackerRolls[i]) defenderLeftover--;
  });
  return { attackerLeftover, defenderLeftover };
};

const getDiceCount = (att, def) => {
  const attackerDices =
    (att - 3 >= 0 && 3) || (att - 2 >= 0 && 2) || (att - 1 >= 0 && 1);
  const defenderDices = (def - 2 >= 0 && 2) || (def - 1 >= 0 && 1);
  return { attackerDices, defenderDices };
};

export const getAttackResults = (att, def) => {
  let attackerArmy = att;
  let defenderArmy = def;
  console.log('attackerArmy', attackerArmy);
  console.log('defenderArmy', defenderArmy);
  while (attackerArmy && defenderArmy) {
    const { attackerDices, defenderDices } = getDiceCount(
      attackerArmy,
      defenderArmy,
    );
    console.log('attackerDices:', attackerDices);
    console.log('defenderDices:', defenderDices);
    attackerArmy -= attackerDices;
    defenderArmy -= defenderDices;
    console.log('attackerArmy', attackerArmy);
    console.log('defenderArmy', defenderArmy);
    const { attackerLeftover, defenderLeftover } = throwDices(
      attackerDices,
      defenderDices,
    );
    console.log('attackerLeftover', attackerLeftover);
    console.log('defenderLeftover', defenderLeftover);
    attackerArmy += attackerLeftover;
    defenderArmy += defenderLeftover;
    console.log('attackerArmy', attackerArmy);
    console.log('defenderArmy', defenderArmy);
    // break
  }
  return { attackerArmy, defenderArmy };
};

// Old calculation model
// const damage = amount - defender.armies;
// if (damage > 0) {
//   // win - attacker wins
//   attacker.armies -= amount;
//   defender.owner = attacker.owner;
//   defender.armies = damage;
//   this.loseContinent(gameId, to);
//   this.winContinent(gameId, playerId, to);
//   this.eliminatePlayer(gameId, playerId, defenderId);
//   this.checkForWin(gameId);
// } else if (damage <= 0) {
//   // lose - attacker loses
//   attacker.armies -= amount;
//   defender.armies = defender.armies - amount || 1;
// }
