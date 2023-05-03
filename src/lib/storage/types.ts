export interface IStorage {
  folder: string;

  set: (key: string, value: string | Buffer) => Promise<unknown>;
  get: (key: string) => Promise<unknown>;
}

export interface IStorageConstructor {
  new (folder: string): IStorage;
}
