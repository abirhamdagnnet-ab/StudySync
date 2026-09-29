const seededAttemptGroups = [
  { studentId: "41", topicId: "1", topicName: "Fractions", results: [false, false, false, true, false, false, true, false, false, true] },
  { studentId: "41", topicId: "2", topicName: "Algebra", results: [true, true, false, true] },
  { studentId: "41", topicId: "3", topicName: "Geometry", results: [false, true] },
  { studentId: "42", topicId: "1", topicName: "Fractions", results: [true, true] },
  { studentId: "42", topicId: "2", topicName: "Algebra", results: [false, true, false, false] },
];

let attemptId = 1;
const seededAttempts = seededAttemptGroups.flatMap((group) => group.results.map((isCorrect, index) => {
  const answeredAt = new Date(Date.UTC(2026, 8, 1 + index));
  return {
    id: attemptId++,
    student_id: group.studentId,
    topic_id: group.topicId,
    topic_name: group.topicName,
    is_correct: isCorrect,
    answered_at: answeredAt,
  };
}));

export { seededAttempts };