import * as migration_20261104_082959_initial from './20261104_082959_initial';
import * as migration_20261104_093713_storage from './20261104_093713_storage';
import * as migration_20261104_135806_reports from './20261104_135806_reports';

export const migrations = [
  {
    up: migration_20261104_082959_initial.up,
    down: migration_20261104_082959_initial.down,
    name: '20261104_082959_initial',
  },
  {
    up: migration_20261104_093713_storage.up,
    down: migration_20261104_093713_storage.down,
    name: '20261104_093713_storage',
  },
  {
    up: migration_20261104_135806_reports.up,
    down: migration_20261104_135806_reports.down,
    name: '20261104_135806_reports'
  },
];
