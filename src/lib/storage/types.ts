export interface IStorage {
  subDir?: string;

  set(key: string, value: string): Promise<unknown>;
  get(key: string): Promise<string | boolean>;
}

export interface IStorageConstructor {
  new (subDir?: string): IStorage;
}
