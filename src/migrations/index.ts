import * as migration_20261106_093315_initial from './20261106_093315_initial';

export const migrations = [
  {
    up: migration_20261106_093315_initial.up,
    down: migration_20261106_093315_initial.down,
    name: '20261106_093315_initial'
  },
];
