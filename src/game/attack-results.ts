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

  let attackerLeftover = attacker;
  let defenderLeftover = defender;
  defenderRolls.forEach((defenderValue, i) => {
    if (defenderValue >= attackerRolls[i]) attackerLeftover--;
    if (defenderValue < attackerRolls[i]) defenderLeftover--;
  });
  return { attackerLeftover, defenderLeftover, attackerRolls, defenderRolls };
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
  const attackingDiceRolls = [];
  const defendingDiceRolls = [];
  while (attackerArmy && defenderArmy) {
    const { attackerDices, defenderDices } = getDiceCount(
      attackerArmy,
      defenderArmy,
    );
    attackerArmy -= attackerDices;
    defenderArmy -= defenderDices;
    const { attackerLeftover, defenderLeftover, attackerRolls, defenderRolls } =
      throwDices(attackerDices, defenderDices);
    attackingDiceRolls.push(attackerRolls);
    defendingDiceRolls.push(defenderRolls);
    attackerArmy += attackerLeftover;
    defenderArmy += defenderLeftover;
    // break
  }
  return { attackerArmy, defenderArmy, attackingDiceRolls, defendingDiceRolls };
};
