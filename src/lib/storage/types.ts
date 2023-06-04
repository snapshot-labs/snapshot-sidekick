export interface IStorage {
  subDir?: string;

  set(key: string, value: string): Promise<unknown>;
  get(key: string): Promise<unknown>;
  list(): Promise<any>;
}

export interface IStorageConstructor {
  new (subDir?: string): IStorage;
}
