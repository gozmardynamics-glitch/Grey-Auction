import { Test } from '@nestjs/testing';
import { StorageModule } from './storage.module';
import { StorageService } from './storage.service';
import { STORAGE_DRIVER, StorageDriver } from './storage-driver.interface';
import { LocalStorageDriver } from './drivers/local-storage.driver';
import { S3StorageDriver } from './drivers/s3-storage.driver';

describe('StorageModule driver selection', () => {
  const OLD = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD };
  });

  it('defaults to the local driver when STORAGE_DRIVER is unset', async () => {
    delete process.env.STORAGE_DRIVER;
    const module = await Test.createTestingModule({
      imports: [StorageModule.forRoot()],
    }).compile();
    const driver = module.get<StorageDriver>(STORAGE_DRIVER);
    expect(driver).toBeInstanceOf(LocalStorageDriver);
    // StorageService is resolvable too.
    expect(module.get(StorageService)).toBeInstanceOf(StorageService);
    await module.close();
  });

  it('selects the S3 driver when STORAGE_DRIVER=s3 and creds are present', async () => {
    process.env.STORAGE_DRIVER = 's3';
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    process.env.S3_ACCESS_KEY = 'key';
    process.env.S3_SECRET_KEY = 'secret';
    process.env.S3_BUCKET = 'bucket';
    const module = await Test.createTestingModule({
      imports: [StorageModule.forRoot()],
    }).compile();
    const driver = module.get<StorageDriver>(STORAGE_DRIVER);
    expect(driver).toBeInstanceOf(S3StorageDriver);
    await module.close();
  });

  it('falls back to local when STORAGE_DRIVER=s3 but creds are missing', async () => {
    process.env.STORAGE_DRIVER = 's3';
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
    const module = await Test.createTestingModule({
      imports: [StorageModule.forRoot()],
    }).compile();
    const driver = module.get<StorageDriver>(STORAGE_DRIVER);
    expect(driver).toBeInstanceOf(LocalStorageDriver);
    await module.close();
  });
});
