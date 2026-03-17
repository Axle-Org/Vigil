export class Vigil {
  constructor(private apiKey: string) {}

  async getTTL(contractId: string, key?: string) {
    // TODO: Implement TTL query
  }

  async getHealth(contractId: string) {
    // TODO: Implement health query
    return { score: 100 }
  }

  async bumpTTL(contractId: string, options: any) {
    // TODO: Implement bump TTL
  }
}
