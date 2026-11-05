import * as migration_20261105_123612_initial from './20261105_123612_initial';

export const migrations = [
  {
    up: migration_20261105_123612_initial.up,
    down: migration_20261105_123612_initial.down,
    name: '20261105_123612_initial'
  },
];
