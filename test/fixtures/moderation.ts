// Mock return results from SQL
export const SqlFixtures: Record<string, any[]> = {
  flaggedLinks: [
    { action: 'flag', type: 'link', value: 'https://gogle.com' },
    { action: 'flag', type: 'link', value: 'https://facebook.com' }
  ],
  flaggedProposals: [
    { action: 'flag', type: 'proposal', value: '0x1' },
    { action: 'flag', type: 'proposal', value: '0x2' }
  ],
  flaggedSpaces: [
    { action: 'flag', type: 'space', value: 'space3.eth' },
    { action: 'flag', type: 'space', value: 'space4.eth' }
  ],
  verifiedSpaces: [
    { action: 'verify', type: 'space', value: 'space1.eth' },
    { action: 'verify', type: 'space', value: 'space2.eth' }
  ]
};
