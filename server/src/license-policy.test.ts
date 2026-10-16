import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fitsIpGroups, isLaunch, planSeats } from './license-policy.js';

test('60-day launch window and manual override', () => {
  const published = '2026-01-01T00:00:00.000Z';
  assert.equal(isLaunch(published, 'auto', '2026-03-01T23:59:59.999Z'), true);
  assert.equal(isLaunch(published, 'auto', '2026-03-02T00:00:00.000Z'), false);
  assert.equal(isLaunch(published, 'launch', '2026-12-01T00:00:00.000Z'), true);
  assert.equal(isLaunch(published, 'standard', '2026-01-02T00:00:00.000Z'), false);
});

test('Spawn, Craft and Nexus require the expected seats and paid expiry', () => {
  const now = '2026-10-16T00:00:00.000Z';
  assert.equal(planSeats('Spawn', null, ['Free'], false, now), 1);
  assert.equal(planSeats('Spawn', null, [], false, now), 0);
  assert.equal(planSeats('Craft', '2026-11-16T00:00:00.000Z', [], true, now), 0);
  assert.equal(planSeats('Craft', '2026-11-16T00:00:00.000Z', [], false, now), 1);
  assert.equal(planSeats('Nexus', '2026-11-16T00:00:00.000Z', [], true, now), 2);
  assert.equal(planSeats('Nexus', '2026-10-15T00:00:00.000Z', [], false, now), 0);
});

test('each purchase covers one public IP with two installations', () => {
  assert.equal(fitsIpGroups([2], 1, 0), true);
  assert.equal(fitsIpGroups([3], 1, 0), false);
  assert.equal(fitsIpGroups([1, 1], 1, 0), false);
  assert.equal(fitsIpGroups([2, 2], 2, 0), true);
  assert.equal(fitsIpGroups([2, 1], 1, 1), true);
  assert.equal(fitsIpGroups([3], 1, 1), true);
});
