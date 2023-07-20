export interface IStorage {
  subDir?: string;

  set(key: string, value: string | Buffer): Promise<boolean>;
  get(key: string): Promise<Buffer | boolean>;
}

export interface IStorageConstructor {
  new (subDir?: string): IStorage;
}
