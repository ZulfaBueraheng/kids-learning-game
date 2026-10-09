import { ACHIEVEMENTS, coinsForStage, earnedAchievements, levelInfo, starsFor, xpForAnswer } from './rewards.engine.js';

describe('rewards engine', () => {
  it('awards stars by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(4, 5)).toBe(2);
    expect(starsFor(3, 5)).toBe(1);
    expect(starsFor(2, 5)).toBe(0);
    expect(starsFor(0, 0)).toBe(0);
  });

  it('always gives some XP for trying', () => {
    expect(xpForAnswer(false, 5)).toBeGreaterThan(0);
    expect(xpForAnswer(true, 3)).toBeGreaterThan(xpForAnswer(true, 1));
  });

  it('computes levels from XP', () => {
    expect(levelInfo(0)).toEqual({ level: 1, levelStartXp: 0, nextLevelXp: 100 });
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(300).level).toBe(3);
    expect(levelInfo(2450).level).toBe(7);
  });

  it('evaluates achievements from facts', () => {
    const none = earnedAchievements({ placementCompleted: false, stagesCompleted: 0, perfectStages: 0, masteredSkills: [], xp: 0, worldsCompleted: 0 });
    expect(none).toEqual([]);
    const some = earnedAchievements({
      placementCompleted: true,
      stagesCompleted: 1,
      perfectStages: 0,
      masteredSkills: ['COUNTING'],
      xp: 120,
      worldsCompleted: 0,
    });
    expect(some.sort()).toEqual(['COUNTING_MASTER', 'FIRST_MASTERY', 'FIRST_STAR', 'FIRST_STEP']);
  });

  it('has a rule for every defined achievement', () => {
    const all = earnedAchievements({
      placementCompleted: true,
      stagesCompleted: 10,
      perfectStages: 1,
      masteredSkills: [
        'COUNTING',
        'ADD_SINGLE',
        'SUB_SINGLE',
        'MULT_TABLES_2_5',
        'DIV_BASIC',
        'FRAC_CONCEPT',
        'WORD_ADD_SUB',
        'DEC_COMPARE',
        'PERCENT_OF',
        'RATIO_CONCEPT',
        'GEO_PERIMETER_AREA',
        'ALG_EQUATIONS',
        'PS_MULTI_STEP',
        'EN_VOCAB_PICTURE',
        'SCI_LIVING',
        'TH_WORDS',
        'LOG_DEDUCTION',
        'TIME_CLOCK',
        'MONEY_THAI',
        'DATA_GRAPH',
        'EN_CONVERSATION',
        'EN_READING',
        'SCI_ECOSYSTEM',
        'SCI_ELECTRICITY',
        'TH_FINAL_SOUNDS',
        'TH_IDIOMS',
        'LOG_CODING',
        'LOG_GRID_LOGIC',
      ],
      xp: 1000,
      worldsCompleted: 1,
      bossesDefeated: 12,
      itemsOwned: 5,
      itemsBought: 1,
      subjectsMastered: 5,
      totalSubjects: 5,
      miningStages: 5,
      blockBossesDefeated: 6,
      blockWorlds: 6,
    });
    expect(all.sort()).toEqual(ACHIEVEMENTS.map((a) => a.code).sort());
  });

  it('awards "all-rounder" only when every subject has a mastered skill', () => {
    const base = { placementCompleted: true, stagesCompleted: 0, perfectStages: 0, masteredSkills: [], xp: 0, worldsCompleted: 0 };
    expect(earnedAchievements({ ...base, subjectsMastered: 4, totalSubjects: 5 })).not.toContain('ALL_ROUNDER');
    expect(earnedAchievements({ ...base, subjectsMastered: 5, totalSubjects: 5 })).toContain('ALL_ROUNDER');
  });

  it('crowns a block-world legend only after every block boss', () => {
    const base = { placementCompleted: true, stagesCompleted: 0, perfectStages: 0, masteredSkills: [], xp: 0, worldsCompleted: 0 };
    expect(earnedAchievements({ ...base, blockBossesDefeated: 5, blockWorlds: 6 })).not.toContain('BLOCK_LEGEND');
    expect(earnedAchievements({ ...base, blockBossesDefeated: 6, blockWorlds: 6 })).toContain('BLOCK_LEGEND');
    expect(earnedAchievements({ ...base, blockBossesDefeated: 0, blockWorlds: 0 })).not.toContain('BLOCK_LEGEND');
    expect(earnedAchievements({ ...base, miningStages: 4 })).not.toContain('BLOCK_MINER');
    expect(earnedAchievements({ ...base, miningStages: 5 })).toContain('BLOCK_MINER');
  });

  it('gives coins for effort and stars', () => {
    expect(coinsForStage(0, 0)).toBe(0);
    expect(coinsForStage(5, 3)).toBe(14);
  });
});
