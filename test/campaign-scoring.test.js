import test from 'node:test';
import assert from 'node:assert/strict';
import { getCampaignSpeedBonus } from '../src/config/gameData.js';

test('campaign speed bonus rewards faster completion', () => {
    const fast = getCampaignSpeedBonus(1, 25);
    const average = getCampaignSpeedBonus(1, 55);
    const slow = getCampaignSpeedBonus(1, 80);
    assert.ok(fast > average);
    assert.ok(average > slow);
});

test('campaign speed bonus is capped and expires after the level cutoff', () => {
    assert.equal(getCampaignSpeedBonus(1, 0), 400);
    assert.equal(getCampaignSpeedBonus(1, 83), 0);
    assert.equal(getCampaignSpeedBonus(6, 0), 2000);
});
