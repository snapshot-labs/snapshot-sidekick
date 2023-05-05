export interface IStorage {
  subDir?: string;

  set(key: string, value: string | Buffer): Promise<unknown>;
  get(key: string): Promise<unknown>;
}

export interface IStorageConstructor {
  new (subDir?: string): IStorage;
}
