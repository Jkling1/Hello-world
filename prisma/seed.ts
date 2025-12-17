import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DOMAINS = [
  { code: 'D1', name: 'Basic & Applied Sciences + Nutrition', weightPct: 15 },
  { code: 'D2', name: 'Client Relations & Behavioral Coaching', weightPct: 15 },
  { code: 'D3', name: 'Assessment', weightPct: 16 },
  { code: 'D4', name: 'Exercise Technique & Training Instruction', weightPct: 24 },
  { code: 'D5', name: 'Program Design', weightPct: 20 },
  { code: 'D6', name: 'Professional Development & Responsibility', weightPct: 10 },
];

const SUBTOPICS = [
  // D1 Subtopics
  { domainCode: 'D1', title: 'Muscle Fiber Types', summary: 'Understanding Type I, Type IIa, and Type IIx muscle fibers and their characteristics.' },
  { domainCode: 'D1', title: 'Energy Systems', summary: 'ATP-PC, glycolytic, and oxidative energy systems and their contributions to exercise.' },
  { domainCode: 'D1', title: 'Nutrition Fundamentals', summary: 'Macronutrients, micronutrients, hydration, and basic nutritional guidelines.' },

  // D2 Subtopics
  { domainCode: 'D2', title: 'Behavior Change Models', summary: 'Transtheoretical Model, Social Cognitive Theory, and other behavior change frameworks.' },
  { domainCode: 'D2', title: 'Goal Setting', summary: 'SMART goals, intrinsic vs extrinsic motivation, and client communication strategies.' },
  { domainCode: 'D2', title: 'Motivational Interviewing', summary: 'Client-centered communication techniques to enhance motivation and adherence.' },

  // D3 Subtopics
  { domainCode: 'D3', title: 'Health Screening', summary: 'PAR-Q+, health history questionnaires, and risk stratification.' },
  { domainCode: 'D3', title: 'Postural Assessment', summary: 'Overhead squat assessment, static posture evaluation, and movement compensations.' },
  { domainCode: 'D3', title: 'Performance Assessments', summary: 'Cardiorespiratory, flexibility, strength, and functional movement assessments.' },

  // D4 Subtopics
  { domainCode: 'D4', title: 'Exercise Technique - Flexibility', summary: 'Static, dynamic, and myofascial release techniques and proper coaching.' },
  { domainCode: 'D4', title: 'Exercise Technique - Resistance', summary: 'Proper form for major resistance exercises including squats, presses, and rows.' },
  { domainCode: 'D4', title: 'Coaching and Spotting', summary: 'Effective coaching cues, demonstration, and proper spotting techniques.' },

  // D5 Subtopics
  { domainCode: 'D5', title: 'OPT Model Phases', summary: 'The five phases of the Optimum Performance Training model and their progressions.' },
  { domainCode: 'D5', title: 'Acute Variables', summary: 'Sets, reps, tempo, rest intervals, and their application across training phases.' },
  { domainCode: 'D5', title: 'Special Populations', summary: 'Programming considerations for youth, older adults, and clients with chronic conditions.' },

  // D6 Subtopics
  { domainCode: 'D6', title: 'Scope of Practice', summary: 'Understanding professional boundaries and appropriate referrals to other health professionals.' },
  { domainCode: 'D6', title: 'Legal and Ethical Considerations', summary: 'Liability, informed consent, confidentiality, and professional ethics.' },
  { domainCode: 'D6', title: 'Emergency Procedures', summary: 'CPR/AED protocols, injury response, and emergency action planning.' },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Create domains
  console.log('Creating domains...');
  const domains = await Promise.all(
    DOMAINS.map((domain) =>
      prisma.domain.upsert({
        where: { code: domain.code },
        update: domain,
        create: domain,
      })
    )
  );

  // Create subtopics
  console.log('Creating subtopics...');
  const subtopicPromises = SUBTOPICS.map(async (subtopic) => {
    const domain = domains.find((d) => d.code === subtopic.domainCode);
    if (!domain) return null;

    return prisma.subtopic.create({
      data: {
        title: subtopic.title,
        summary: subtopic.summary,
        domainId: domain.id,
      },
    });
  });

  const subtopics = (await Promise.all(subtopicPromises)).filter(Boolean);

  // Sample Questions (2 per domain)
  console.log('Creating sample questions...');

  const sampleQuestions = [
    // D1 Questions
    {
      domainCode: 'D1',
      subtopicTitle: 'Energy Systems',
      stem: 'A client is performing a 400-meter sprint. Which energy system will contribute MOST to this activity?',
      choices: [
        'ATP-PC system',
        'Glycolytic system',
        'Oxidative system',
        'Phosphagen system exclusively',
      ],
      answerIdx: 1,
      rationale: 'The glycolytic (anaerobic glycolysis) system is the primary energy contributor for high-intensity activities lasting 30 seconds to 2 minutes, such as a 400m sprint. The ATP-PC system dominates for 0-10 seconds, while the oxidative system becomes primary for longer durations (>2 minutes).',
      difficulty: 'Moderate',
      tags: ['energy-systems', 'anaerobic'],
    },
    {
      domainCode: 'D1',
      subtopicTitle: 'Nutrition Fundamentals',
      stem: 'How many calories per gram does protein provide?',
      choices: ['3 calories', '4 calories', '7 calories', '9 calories'],
      answerIdx: 1,
      rationale: 'Protein provides 4 calories per gram. Carbohydrates also provide 4 cal/g, fat provides 9 cal/g, and alcohol provides 7 cal/g. This is fundamental nutrition knowledge for personal trainers.',
      difficulty: 'Easy',
      tags: ['nutrition', 'macronutrients'],
    },

    // D2 Questions
    {
      domainCode: 'D2',
      subtopicTitle: 'Behavior Change Models',
      stem: 'A client states: "I know I should exercise, but I just can\'t seem to get started." This client is MOST likely in which stage of the Transtheoretical Model?',
      choices: ['Precontemplation', 'Contemplation', 'Preparation', 'Action'],
      answerIdx: 1,
      rationale: 'The Contemplation stage is characterized by awareness of the benefits of change and intention to act within the next 6 months, but no concrete action yet. The client acknowledges "should exercise" (awareness) but hasn\'t started (no action). Precontemplation shows no intention, while Preparation includes small steps toward change.',
      difficulty: 'Moderate',
      tags: ['behavior-change', 'TTM'],
    },
    {
      domainCode: 'D2',
      subtopicTitle: 'Goal Setting',
      stem: 'Which of the following is an example of a SMART goal?',
      choices: [
        'I want to get stronger',
        'I will lose weight this year',
        'I will perform strength training 3 days per week for the next 8 weeks',
        'I want to look better for summer',
      ],
      answerIdx: 2,
      rationale: 'SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Option C specifies the behavior (strength training), frequency (3 days/week), and timeframe (8 weeks). The other options lack specificity, measurability, or defined timeframes.',
      difficulty: 'Easy',
      tags: ['goal-setting', 'SMART'],
    },

    // D3 Questions
    {
      domainCode: 'D3',
      subtopicTitle: 'Postural Assessment',
      stem: 'During an overhead squat assessment, a client\'s knees move inward. This compensation MOST likely indicates overactivity of which muscle group?',
      choices: [
        'Gluteus medius and maximus',
        'Adductors and biceps femoris (short head)',
        'Vastus medialis oblique',
        'Tibialis anterior',
      ],
      answerIdx: 1,
      rationale: 'Knee valgus (knees moving inward) during the overhead squat typically indicates overactive adductors and biceps femoris short head, combined with underactive gluteus medius/maximus and vastus medialis oblique. This pattern is common and should be addressed through corrective exercise strategies.',
      difficulty: 'Challenging',
      tags: ['assessment', 'OHSA', 'movement-compensation'],
    },
    {
      domainCode: 'D3',
      subtopicTitle: 'Performance Assessments',
      stem: 'What is the PRIMARY purpose of the YMCA step test?',
      choices: [
        'Assess lower body strength',
        'Assess balance and coordination',
        'Estimate cardiorespiratory fitness',
        'Measure flexibility',
      ],
      answerIdx: 2,
      rationale: 'The YMCA step test is a submaximal cardiorespiratory assessment that estimates aerobic fitness (VO2max) based on heart rate recovery after stepping. It provides a safe, practical alternative to maximal testing for general population clients.',
      difficulty: 'Easy',
      tags: ['assessment', 'cardio', 'fitness-testing'],
    },

    // D4 Questions
    {
      domainCode: 'D4',
      subtopicTitle: 'Exercise Technique - Resistance',
      stem: 'When spotting a client performing a barbell back squat, where should the trainer position themselves?',
      choices: [
        'In front of the client',
        'Behind the client with hands near the bar',
        'To the side of the client',
        'Behind the client with hands at the client\'s hips or torso',
      ],
      answerIdx: 3,
      rationale: 'The proper spotting position for a back squat is behind the client with hands positioned at the hips or under the arms (torso), ready to assist if needed. The spotter should NOT grab the bar, as this can cause instability. This position allows the spotter to help lift the client\'s torso if they struggle.',
      difficulty: 'Moderate',
      tags: ['spotting', 'safety', 'resistance-training'],
    },
    {
      domainCode: 'D4',
      subtopicTitle: 'Exercise Technique - Flexibility',
      stem: 'Static stretching should be held for how long to achieve optimal results?',
      choices: ['5-10 seconds', '15-20 seconds', '30 seconds', '2-3 minutes'],
      answerIdx: 2,
      rationale: 'Research supports holding static stretches for 30 seconds to achieve optimal flexibility improvements. Shorter durations may be insufficient for adaptive lengthening, while excessively long holds (>60 seconds) show diminishing returns and may impair subsequent performance.',
      difficulty: 'Easy',
      tags: ['flexibility', 'stretching', 'corrective-exercise'],
    },

    // D5 Questions
    {
      domainCode: 'D5',
      subtopicTitle: 'OPT Model Phases',
      stem: 'Which OPT phase is designed to improve stabilization endurance and develop optimal neuromuscular control?',
      choices: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 5'],
      answerIdx: 0,
      rationale: 'Phase 1 (Stabilization Endurance) focuses on building a foundation of muscular endurance, stability, and neuromuscular efficiency. It emphasizes high reps (12-20), controlled tempos, and unstable environments to develop proper movement patterns before progressing to higher-intensity phases.',
      difficulty: 'Easy',
      tags: ['OPT', 'program-design', 'phase-1'],
    },
    {
      domainCode: 'D5',
      subtopicTitle: 'Acute Variables',
      stem: 'For a client in Phase 3 (Hypertrophy) of the OPT model, what is the recommended rest interval between sets?',
      choices: ['0-30 seconds', '30-60 seconds', '0-90 seconds', '3-5 minutes'],
      answerIdx: 2,
      rationale: 'Phase 3 (Hypertrophy) typically uses 0-90 second rest intervals to maintain metabolic demand and hormonal response conducive to muscle growth. Shorter rest periods (compared to strength/power phases) keep metabolic stress high, which is a key driver of hypertrophic adaptations.',
      difficulty: 'Moderate',
      tags: ['OPT', 'acute-variables', 'hypertrophy'],
    },

    // D6 Questions
    {
      domainCode: 'D6',
      subtopicTitle: 'Scope of Practice',
      stem: 'A client asks you to recommend specific supplements to help with their high cholesterol. What is the MOST appropriate response?',
      choices: [
        'Recommend fish oil and plant sterols',
        'Refer them to a registered dietitian or physician',
        'Provide general education about supplements and let them decide',
        'Design a meal plan that includes cholesterol-lowering foods',
      ],
      answerIdx: 1,
      rationale: 'Personal trainers should NOT diagnose medical conditions, prescribe supplements for medical issues, or provide medical nutrition therapy. High cholesterol is a medical condition requiring assessment and treatment recommendations from qualified healthcare providers (physician, RD). Referring the client is the appropriate and ethical response.',
      difficulty: 'Moderate',
      tags: ['scope-of-practice', 'referral', 'ethics'],
    },
    {
      domainCode: 'D6',
      subtopicTitle: 'Legal and Ethical Considerations',
      stem: 'What is the PRIMARY purpose of having clients sign an informed consent form?',
      choices: [
        'To completely protect the trainer from all liability',
        'To document that the client understands the risks and benefits of participation',
        'To prevent clients from suing if they get injured',
        'To transfer all risk to the client',
      ],
      answerIdx: 1,
      rationale: 'Informed consent documents that the client has been educated about the risks, benefits, and procedures of training and voluntarily agrees to participate. It does NOT eliminate trainer liability or prevent lawsuits, but it demonstrates that proper disclosure occurred. Trainers must still meet professional standards of care.',
      difficulty: 'Moderate',
      tags: ['legal', 'informed-consent', 'risk-management'],
    },
  ];

  for (const q of sampleQuestions) {
    const domain = domains.find((d) => d.code === q.domainCode);
    const subtopic = subtopics.find((s) => s?.title === q.subtopicTitle);

    if (domain) {
      await prisma.question.create({
        data: {
          stem: q.stem,
          choices: JSON.stringify(q.choices),
          answerIdx: q.answerIdx,
          rationale: q.rationale,
          difficulty: q.difficulty,
          domainId: domain.id,
          subtopicId: subtopic?.id,
          tags: JSON.stringify(q.tags),
        },
      });
    }
  }

  // Sample Flashcards
  console.log('Creating sample flashcards...');

  const sampleFlashcards = [
    // D1 Flashcards
    { subtopicTitle: 'Muscle Fiber Types', front: 'Type I muscle fibers', back: 'Slow-twitch fibers; high oxidative capacity, fatigue-resistant, recruited for endurance activities and low-intensity contractions.', difficulty: 'Easy' },
    { subtopicTitle: 'Muscle Fiber Types', front: 'Type II muscle fibers', back: 'Fast-twitch fibers; subdivided into Type IIa (moderate oxidative/glycolytic) and Type IIx (high glycolytic, low oxidative); recruited for high-force, explosive movements.', difficulty: 'Easy' },
    { subtopicTitle: 'Energy Systems', front: 'ATP-PC System', back: 'Phosphagen system; provides immediate energy (0-10 seconds); uses stored ATP and creatine phosphate; no oxygen required; used for maximal-effort, short-duration activities.', difficulty: 'Easy' },
    { subtopicTitle: 'Energy Systems', front: 'Glycolytic System', back: 'Anaerobic glycolysis; provides energy for 30 sec - 2 min of high-intensity activity; breaks down glucose/glycogen without oxygen; produces lactate as byproduct.', difficulty: 'Moderate' },
    { subtopicTitle: 'Nutrition Fundamentals', front: 'Macronutrients', back: 'Carbohydrates (4 cal/g), Proteins (4 cal/g), Fats (9 cal/g) - the energy-providing nutrients required in large amounts.', difficulty: 'Easy' },

    // D2 Flashcards
    { subtopicTitle: 'Behavior Change Models', front: 'Transtheoretical Model Stages', back: 'Precontemplation → Contemplation → Preparation → Action → Maintenance (→ Termination). Model describing stages individuals progress through when changing behavior.', difficulty: 'Moderate' },
    { subtopicTitle: 'Goal Setting', front: 'SMART Goals', back: 'Specific, Measurable, Achievable, Relevant, Time-bound - framework for effective goal setting that increases adherence and success.', difficulty: 'Easy' },
    { subtopicTitle: 'Motivational Interviewing', front: 'Open-ended questions', back: 'Questions that cannot be answered with yes/no; encourage clients to elaborate and explore their own motivations (e.g., "What would exercising regularly mean for you?").', difficulty: 'Moderate' },
    { subtopicTitle: 'Behavior Change Models', front: 'Self-efficacy', back: 'An individual\'s belief in their capability to successfully perform a behavior; key component of Social Cognitive Theory and predictor of behavior change success.', difficulty: 'Moderate' },
    { subtopicTitle: 'Goal Setting', front: 'Outcome goals vs Process goals', back: 'Outcome: focus on end result (lose 20 lbs). Process: focus on behaviors needed to achieve outcome (exercise 4x/week). Process goals better for adherence.', difficulty: 'Moderate' },

    // D3 Flashcards
    { subtopicTitle: 'Health Screening', front: 'PAR-Q+', back: 'Physical Activity Readiness Questionnaire - screening tool to identify individuals who should seek medical clearance before beginning exercise.', difficulty: 'Easy' },
    { subtopicTitle: 'Postural Assessment', front: 'Overhead Squat Assessment (OHSA)', back: 'Dynamic movement assessment observing compensations during a squat with arms overhead; identifies muscle imbalances and movement dysfunctions.', difficulty: 'Moderate' },
    { subtopicTitle: 'Postural Assessment', front: 'Lower crossed syndrome', back: 'Postural distortion pattern: tight hip flexors & erectors, weak glutes & abdominals; results in anterior pelvic tilt and lumbar hyperextension.', difficulty: 'Challenging' },
    { subtopicTitle: 'Performance Assessments', front: 'YMCA Step Test', back: 'Submaximal cardiorespiratory test; client steps up/down on 12-inch bench for 3 minutes at 96 bpm; heart rate recovery estimates VO2max.', difficulty: 'Moderate' },
    { subtopicTitle: 'Performance Assessments', front: 'Sit-and-reach test', back: 'Flexibility assessment measuring hamstring and low back flexibility; client sits with legs extended and reaches forward along a measuring device.', difficulty: 'Easy' },

    // D4 Flashcards
    { subtopicTitle: 'Exercise Technique - Flexibility', front: 'Static stretching', back: 'Holding a stretch position for 30 seconds; low force, long duration; best performed after workouts; improves flexibility through neural adaptation and tissue remodeling.', difficulty: 'Easy' },
    { subtopicTitle: 'Exercise Technique - Flexibility', front: 'Dynamic stretching', back: 'Active movements through full ROM without holding end position; mimics activity movements; ideal for warm-up; improves mobility and prepares nervous system.', difficulty: 'Easy' },
    { subtopicTitle: 'Exercise Technique - Flexibility', front: 'Self-myofascial release (SMR)', back: 'Foam rolling technique; applies pressure to adhesions/trigger points; autogenic inhibition relaxes overactive muscles; typically 30 sec per tender area.', difficulty: 'Moderate' },
    { subtopicTitle: 'Exercise Technique - Resistance', front: 'Proper squat form', back: 'Feet shoulder-width, toes slightly out; neutral spine; knees track over toes; hips back and down; chest up; descend until thighs parallel or below (if mobility allows).', difficulty: 'Moderate' },
    { subtopicTitle: 'Coaching and Spotting', front: 'Effective coaching cues', back: 'Clear, concise instructions focused on 1-2 key points; use external focus ("push the floor away") vs internal ("contract your quads"); positive reinforcement.', difficulty: 'Moderate' },

    // D5 Flashcards
    { subtopicTitle: 'OPT Model Phases', front: 'Phase 1: Stabilization Endurance', back: 'Foundation phase; 12-20 reps, 50-70% 1RM, slow tempo (4/2/1); develops muscular endurance, stability, and neuromuscular control; uses unstable surfaces.', difficulty: 'Moderate' },
    { subtopicTitle: 'OPT Model Phases', front: 'Phase 2: Strength Endurance', back: 'Hybrid phase; combines stabilization and strength training; superset: strength exercise (8-12 reps, 70-80% 1RM) with stabilization exercise (12-15 reps).', difficulty: 'Moderate' },
    { subtopicTitle: 'OPT Model Phases', front: 'Phase 3: Hypertrophy', back: 'Muscle growth phase; 6-12 reps, 75-85% 1RM, moderate tempo (2/0/2), 0-90 sec rest; high volume and metabolic stress drive muscle growth.', difficulty: 'Moderate' },
    { subtopicTitle: 'OPT Model Phases', front: 'Phase 4: Maximal Strength', back: 'Max force production; 1-5 reps, 85-100% 1RM, fast/explosive tempo, 3-5 min rest; develops peak strength through neural adaptations and recruitment.', difficulty: 'Moderate' },
    { subtopicTitle: 'OPT Model Phases', front: 'Phase 5: Power', back: 'Rate of force production; superset: strength exercise (1-5 reps, 85-100% 1RM) + power exercise (1-10 reps, explosive); develops speed-strength.', difficulty: 'Challenging' },
    { subtopicTitle: 'Acute Variables', front: 'Acute training variables', back: 'Sets, repetitions, tempo, rest intervals, exercise selection, intensity (load), training frequency, volume - the components manipulated to design training programs.', difficulty: 'Easy' },
    { subtopicTitle: 'Acute Variables', front: 'Tempo notation', back: 'Three or four numbers (e.g., 4/2/1): eccentric / isometric / concentric / (isometric); seconds spent in each phase of movement.', difficulty: 'Moderate' },
    { subtopicTitle: 'Special Populations', front: 'Youth training guidelines', back: 'Focus on proper technique over load; emphasize fun and variety; 1-2 sets of 10-15 reps; avoid maximal lifts; progress gradually; prioritize movement quality and skill development.', difficulty: 'Moderate' },

    // D6 Flashcards
    { subtopicTitle: 'Scope of Practice', front: 'Personal trainer scope of practice', back: 'Design and implement exercise programs for healthy individuals and those cleared for exercise; provide general nutrition education; refer clients when conditions exceed qualifications.', difficulty: 'Moderate' },
    { subtopicTitle: 'Scope of Practice', front: 'When to refer to a physician', back: 'Suspected injury or medical condition; positive PAR-Q+ responses; chest pain/dizziness during exercise; requests for medical advice/diagnosis/treatment; medication questions.', difficulty: 'Moderate' },
    { subtopicTitle: 'Scope of Practice', front: 'When to refer to RD/RDN', back: 'Medical nutrition therapy; meal planning for medical conditions; specific supplement protocols; eating disorders; weight management beyond general guidance.', difficulty: 'Moderate' },
    { subtopicTitle: 'Legal and Ethical Considerations', front: 'Informed consent elements', back: 'Nature and purpose of assessment/training; potential risks and discomforts; expected benefits; right to withdraw; confidentiality; client signature acknowledging understanding.', difficulty: 'Moderate' },
    { subtopicTitle: 'Legal and Ethical Considerations', front: 'Negligence', back: 'Failure to act as a reasonable and prudent professional would under similar circumstances; must prove duty, breach, causation, and damages to establish negligence.', difficulty: 'Challenging' },
    { subtopicTitle: 'Emergency Procedures', front: 'CAB sequence', back: 'Compressions, Airway, Breathing - current CPR priority sequence; immediate chest compressions take priority over airway/breathing for cardiac arrest.', difficulty: 'Easy' },
    { subtopicTitle: 'Emergency Procedures', front: 'AED use', back: 'Automated External Defibrillator; turn on, attach pads as shown, follow voice prompts, ensure no one touching victim during analysis/shock, resume CPR immediately after shock.', difficulty: 'Easy' },
  ];

  for (const fc of sampleFlashcards) {
    const subtopic = subtopics.find((s) => s?.title === fc.subtopicTitle);
    if (subtopic) {
      await prisma.flashcard.create({
        data: {
          front: fc.front,
          back: fc.back,
          subtopicId: subtopic.id,
          difficulty: fc.difficulty,
        },
      });
    }
  }

  // Create default exam template
  console.log('Creating default exam template...');
  await prisma.examTemplate.upsert({
    where: { id: 'default-cpt7' },
    update: {},
    create: {
      id: 'default-cpt7',
      name: 'CPT-7 Full Exam',
      totalItems: 120,
      unscoredItems: 20,
      timeLimitMin: 120,
      domainWeights: JSON.stringify({
        D1: 15,
        D2: 15,
        D3: 16,
        D4: 24,
        D5: 20,
        D6: 10,
      }),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`Created:`);
  console.log(`  - ${domains.length} domains`);
  console.log(`  - ${subtopics.length} subtopics`);
  console.log(`  - ${sampleQuestions.length} sample questions`);
  console.log(`  - ${sampleFlashcards.length} sample flashcards`);
  console.log(`  - 1 exam template`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
