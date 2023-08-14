export interface IStorage {
  subDir?: string;

  set(key: string, value: string | Buffer): Promise<boolean>;
  get(key: string): Promise<Buffer | boolean>;
  delete(key: string): Promise<boolean>;
}

export interface IStorageConstructor {
  new (subDir?: string): IStorage;
}
