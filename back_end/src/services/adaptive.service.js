const updateStreaks = (session, isCorrect) => {
  if (isCorrect) {
    return {
      correct_streak: Math.min(session.correct_streak + 1, 2),
      wrong_streak: 0,
    };
  }

  return {
    correct_streak: 0,
    wrong_streak: Math.min(session.wrong_streak + 1, 2),
  };
};

const nextDifficulty = (currentDifficulty, correctStreak, wrongStreak) => {
  const boundedDifficulty = Math.max(1, Math.min(3, Math.trunc(currentDifficulty)));

  // Two consecutive correct answers move up one level; two wrong answers move down one.
  if (correctStreak >= 2 && boundedDifficulty < 3) {
    return {
      current_difficulty: boundedDifficulty + 1,
      correct_streak: 0,
      wrong_streak: 0,
    };
  }

  if (wrongStreak >= 2 && boundedDifficulty > 1) {
    return {
      current_difficulty: boundedDifficulty - 1,
      correct_streak: 0,
      wrong_streak: 0,
    };
  }

  return {
    current_difficulty: boundedDifficulty,
    correct_streak: correctStreak,
    wrong_streak: wrongStreak,
  };
};

const updateAbilityScore = (score, isCorrect, difficulty) => {
  const currentScore = score ?? 50;
  const boundedScore = Math.max(0, Math.min(100, Number(currentScore)));
  const boundedDifficulty = Math.max(1, Math.min(3, Math.trunc(difficulty)));

  // Each difficulty level changes the score by 2, 4, or 6 points; the result never leaves 0-100.
  const step = boundedDifficulty * 2;
  const updatedScore = boundedScore + (isCorrect ? step : -step);
  return Math.max(0, Math.min(100, updatedScore));
};

export { updateStreaks, nextDifficulty, updateAbilityScore };