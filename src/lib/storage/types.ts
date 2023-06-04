export interface IStorage {
  subDir?: string;

  set(key: string, value: string): Promise<unknown>;
  get(key: string): Promise<unknown>;
  delete(key: string): Promise<any>;
  list(): Promise<any>;
  clear(): Promise<boolean>;
}

export interface IStorageConstructor {
  new (subDir?: string): IStorage;
}
