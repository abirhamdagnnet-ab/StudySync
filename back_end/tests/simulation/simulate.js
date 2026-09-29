import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../../src/config/db.js";
import { register } from "../../src/services/auth.service.js";
import { startSession, getNextQuestion, submitAnswer, finishSession } from "../../src/services/quiz.service.js";
import { getStudentProgress } from "../../src/services/progress.service.js";
import { getWeakTopics } from "../../src/services/weakTopic.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const questionsPerTopic = 10;
const studentProfiles = [
  { name: "strong", correctProbability: 0.85 },
  { name: "average", correctProbability: 0.6 },
  { name: "weak", correctProbability: 0.35 },
];

const createRandom = (seed) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const sameJsonValue = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const getAnswer = (question, correctProbability, random) => {
  const questionData = question.answerData;
  if (random() < correctProbability) return questionData.correctAnswer;

  const wrongAnswer = questionData.options.find((option) => !sameJsonValue(option, questionData.correctAnswer));
  if (wrongAnswer === undefined) {
    throw new Error(`Question ${question.id} has no incorrect option for simulation`);
  }
  return wrongAnswer;
};

const loadSimulationTopics = async () => {
  const { rows } = await pool.query(
    `SELECT topics.id AS topic_id, topics.name AS topic_name,
       questions.id AS question_id, questions.options,
       questions.correct_answer, questions.difficulty
     FROM topics
     JOIN questions ON questions.topic_id = topics.id
     WHERE topics.is_active = true AND questions.is_active = true
     ORDER BY topics.id, questions.id`,
  );

  const byTopic = new Map();
  for (const row of rows) {
    const topicKey = String(row.topic_id);
    if (!byTopic.has(topicKey)) {
      byTopic.set(topicKey, {
        id: row.topic_id,
        name: row.topic_name,
        questions: new Map(),
      });
    }
    byTopic.get(topicKey).questions.set(String(row.question_id), {
      options: row.options,
      correctAnswer: row.correct_answer,
      difficulty: row.difficulty,
    });
  }

  const topics = [...byTopic.values()].slice(0, 5);
  if (topics.length < 5) {
    throw new Error("Simulation requires at least five active topics; run npm run migrate and npm run seed first");
  }
  for (const topic of topics) {
    if (topic.questions.size < questionsPerTopic) {
      throw new Error(`Topic ${topic.name} needs at least ${questionsPerTopic} active questions`);
    }
  }

  return topics;
};

const simulateStudent = async ({ profile, topics, runId, random, createdUserIds }) => {
  const email = `simulation-${runId}-${profile.name}@example.test`;
  const auth = await register({
    email,
    password: `Simulation-${runId}-${profile.name}-Pass`,
  });
  const studentId = auth.user.id;
  createdUserIds.push(studentId);

  const difficultyOverTime = [];
  let questionNumber = 0;

  for (const topic of topics) {
    const session = await startSession(studentId, topic.id);
    let currentDifficulty = session.current_difficulty;
    let topicQuestionCount = 0;

    while (topicQuestionCount < questionsPerTopic) {
      const next = await getNextQuestion(session.id, studentId);
      if (next.no_more_questions) {
        throw new Error(`Topic ${topic.name} ran out of questions before the simulation reached 50`);
      }

      const answerData = topic.questions.get(String(next.question.id));
      if (!answerData) throw new Error(`Missing answer data for question ${next.question.id}`);

      const question = { ...next.question, answerData };
      const answer = getAnswer(question, profile.correctProbability, random);
      const result = await submitAnswer(session.id, studentId, question.id, answer);

      questionNumber += 1;
      topicQuestionCount += 1;
      difficultyOverTime.push({
        question_number: questionNumber,
        topic: topic.name,
        question_difficulty: question.difficulty,
        difficulty_before: currentDifficulty,
        difficulty_after: result.current_difficulty,
        is_correct: result.is_correct,
        ability_score: result.ability_score,
      });
      currentDifficulty = result.current_difficulty;
    }

    await finishSession(session.id, studentId);
  }

  const [progress, weakTopics] = await Promise.all([
    getStudentProgress(studentId),
    getWeakTopics(studentId),
  ]);
  const correctCount = difficultyOverTime.filter((entry) => entry.is_correct).length;

  return {
    name: profile.name,
    user_id: studentId,
    email,
    target_correct_probability: profile.correctProbability,
    total_questions: difficultyOverTime.length,
    actual_accuracy: Number((100 * correctCount / difficultyOverTime.length).toFixed(2)),
    difficulty_over_time: difficultyOverTime,
    final_ability_scores_by_topic: progress.topics.map((topic) => ({
      topic_id: topic.topic_id,
      topic_name: topic.topic_name,
      ability_score: Number(topic.ability_score),
      questions_answered: topic.attempts_count,
    })),
    detected_weak_topics: weakTopics,
  };
};

const runSimulation = async () => {
  const seed = Number(process.env.SIMULATION_SEED ?? 20260928);
  if (!Number.isSafeInteger(seed) || seed < 0) {
    throw new Error("SIMULATION_SEED must be a non-negative safe integer");
  }

  const random = createRandom(seed);
  const runId = `${Date.now()}-${seed}`;
  const outputPath = path.resolve(
    process.env.SIMULATION_OUTPUT ?? path.join(__dirname, "results.json"),
  );
  const keepUsers = process.env.SIMULATION_KEEP_USERS === "true";
  const createdUserIds = [];

  try {
    const topics = await loadSimulationTopics();
    const students = [];
    for (const profile of studentProfiles) {
      students.push(await simulateStudent({ profile, topics, runId, random, createdUserIds }));
    }

    const report = {
      generated_at: new Date().toISOString(),
      random_seed: seed,
      questions_per_student: 50,
      topics: topics.map(({ id, name }) => ({ id, name })),
      students,
    };

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    for (const student of students) {
      console.log(`\n${student.name}: ${student.actual_accuracy}% accuracy over ${student.total_questions} questions`);
      console.log("Difficulty over time:");
      console.table(student.difficulty_over_time);
      console.log("Final ability scores by topic:");
      console.table(student.final_ability_scores_by_topic);
      console.log("Detected weak topics:");
      console.table(student.detected_weak_topics);
    }
    console.log(`Simulation report saved to ${outputPath}`);
  } finally {
    if (!keepUsers && createdUserIds.length > 0) {
      await pool.query("DELETE FROM users WHERE id = ANY($1::bigint[])", [createdUserIds]);
      console.log(`Removed ${createdUserIds.length} temporary simulation users`);
    }
    await pool.end();
  }
};

runSimulation().catch((error) => {
  console.error("Simulation failed", error);
  process.exitCode = 1;
});