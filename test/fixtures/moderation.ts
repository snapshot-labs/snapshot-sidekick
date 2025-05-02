// Mock return results from SQL
export const SqlFixtures: Record<string, any[]> = {
  flaggedLinks: [
    { action: 'flag', type: 'link', value: 'https://gogle.com', created: 100 },
    { action: 'flag', type: 'link', value: 'https://facebook.com', created: 100 }
  ],
  flaggedAddresses: [
    { action: 'flag', type: 'address', value: '0x0001', created: 100 },
    { action: 'flag', type: 'address', value: '0x0002', created: 100 }
  ],
  flaggedIps: [
    {
      action: 'flag',
      type: 'ip',
      value: '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0',
      created: 100
    },
    {
      action: 'flag',
      type: 'ip',
      value: '19e36255972107d42b8cecb77ef5622e842e8a50778a6ed8dd1ce94732daca9e',
      created: 100
    }
  ]
};
