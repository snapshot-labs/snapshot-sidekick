// Mock return results from SQL
export const SqlFixtures: Record<string, any[]> = {
  flaggedLinks: [
    { action: 'flag', type: 'link', value: 'https://gogle.com', created: 100 },
    { action: 'flag', type: 'link', value: 'https://facebook.com', created: 100 }
  ],
  flaggedProposals: [
    { action: 'flag', type: 'proposal', value: '0x1', created: 100 },
    { action: 'flag', type: 'proposal', value: '0x2', created: 100 }
  ],
  flaggedSpaces: [
    { action: 'flag', type: 'space', value: 'space3.eth', created: 100 },
    { action: 'flag', type: 'space', value: 'space4.eth', created: 100 }
  ],
  verifiedSpaces: [
    { action: 'verify', type: 'space', value: 'space1.eth', created: 100 },
    { action: 'verify', type: 'space', value: 'space2.eth', created: 100 }
  ]
};
