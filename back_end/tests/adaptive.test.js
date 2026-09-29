import { describe, expect, it } from "@jest/globals";
import { nextDifficulty, updateAbilityScore, updateStreaks } from "../src/services/adaptive.service.js";

describe("adaptive learning rules", () => {
  it("raises difficulty after two correct answers and resets both streaks", () => {
    const first = updateStreaks({ correct_streak: 0, wrong_streak: 0 }, true);
    const second = updateStreaks(first, true);

    expect(nextDifficulty(2, second.correct_streak, second.wrong_streak)).toEqual({
      current_difficulty: 3,
      correct_streak: 0,
      wrong_streak: 0,
    });
  });

  it("lowers difficulty after two wrong answers and resets both streaks", () => {
    const first = updateStreaks({ correct_streak: 0, wrong_streak: 0 }, false);
    const second = updateStreaks(first, false);

    expect(nextDifficulty(2, second.correct_streak, second.wrong_streak)).toEqual({
      current_difficulty: 1,
      correct_streak: 0,
      wrong_streak: 0,
    });
  });

  it("never raises difficulty above 3", () => {
    expect(nextDifficulty(3, 2, 0)).toEqual({
      current_difficulty: 3,
      correct_streak: 2,
      wrong_streak: 0,
    });
  });

  it("never lowers difficulty below 1", () => {
    expect(nextDifficulty(1, 0, 2)).toEqual({
      current_difficulty: 1,
      correct_streak: 0,
      wrong_streak: 2,
    });
  });

  it("resets the opposite streak when answers alternate", () => {
    const afterCorrect = updateStreaks({ correct_streak: 0, wrong_streak: 0 }, true);
    const afterWrong = updateStreaks(afterCorrect, false);
    const afterAnotherCorrect = updateStreaks(afterWrong, true);

    expect(afterCorrect).toEqual({ correct_streak: 1, wrong_streak: 0 });
    expect(afterWrong).toEqual({ correct_streak: 0, wrong_streak: 1 });
    expect(afterAnotherCorrect).toEqual({ correct_streak: 1, wrong_streak: 0 });
    expect(nextDifficulty(2, afterAnotherCorrect.correct_streak, afterAnotherCorrect.wrong_streak))
      .toMatchObject({ current_difficulty: 2 });
  });

  it("caps long streaks at the two-answer threshold", () => {
    let streaks = { correct_streak: 0, wrong_streak: 0 };
    for (let count = 0; count < 20; count += 1) streaks = updateStreaks(streaks, true);

    expect(streaks).toEqual({ correct_streak: 2, wrong_streak: 0 });
  });

  it("moves ability score farther for harder questions", () => {
    expect(updateAbilityScore(50, true, 1)).toBe(52);
    expect(updateAbilityScore(50, true, 2)).toBe(54);
    expect(updateAbilityScore(50, true, 3)).toBe(56);
    expect(updateAbilityScore(50, false, 3)).toBe(44);
  });

  it("uses 50 as the initial score", () => {
    expect(updateAbilityScore(undefined, true, 1)).toBe(52);
    expect(updateAbilityScore(null, false, 1)).toBe(48);
  });

  it("clamps ability score at 0 and 100", () => {
    expect(updateAbilityScore(99, true, 3)).toBe(100);
    expect(updateAbilityScore(1, false, 3)).toBe(0);
    expect(updateAbilityScore(150, true, 1)).toBe(100);
    expect(updateAbilityScore(-10, false, 1)).toBe(0);
  });
});