export interface IStorage {
  set: (key: string, value: string) => Promise<unknown>;
  get: (key: string) => Promise<unknown>;
}

export interface IStorageConstructor {
  new (): IStorage;
}
