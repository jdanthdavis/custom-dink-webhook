import { describe, expect, it } from 'vitest';
import { barracudaTrialHandler } from '../core/chatMsgHandler/barracudaTrialHandler';

describe('barracudaTrialHandler', () => {
  const trials = ['Tempor Tantrum', 'Jubbly Jive', 'Gwenith Glide'];
  const levels = ['Swordfish', 'Marlin', 'Shark'];

  it.each(trials.flatMap((trial) => levels.map((level) => [trial, level])))(
    'formats a %s %s personal best',
    (trial, level) => {
      const msgMap = new Map();
      barracudaTrialHandler(
        `Pigeon Cam has achieved a new ${trial} ${level} personal best: 1:23.45`,
        'Pigeon Cam',
        msgMap,
        'url'
      );
      const msg = [...msgMap.values()][0];
      expect(msg).toContain(
        `**Pigeon Cam** has achieved a new **${trial} ${level}** personal best of **1:23.45!**`
      );
    }
  );

  it('formats a personal best with no precise timer (whole seconds)', () => {
    const msgMap = new Map();
    barracudaTrialHandler(
      'Pigeon Cam has achieved a new Tempor Tantrum Marlin personal best: 4:18',
      'Pigeon Cam',
      msgMap,
      'url'
    );
    const msg = [...msgMap.values()][0];
    expect(msg).toContain(
      '**Pigeon Cam** has achieved a new **Tempor Tantrum Marlin** personal best of **4:18!**'
    );
  });

  it('does not set a message when the text does not match', () => {
    const msgMap = new Map();
    barracudaTrialHandler('unrelated message', 'Pigeon Cam', msgMap, 'url');
    expect(msgMap.size).toBe(0);
  });
});
