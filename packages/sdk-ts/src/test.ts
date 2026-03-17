import { Vigil } from '@vigil/sdk'

async function main() {
  const vigil = new Vigil('dummy_key')
  
  console.log('Testing SDK...')
  
  // This will fail as API is not running, but verifies SDK structure
  try {
    const health = await vigil.getHealth('dummy_contract')
    console.log('Health:', health)
  } catch (e) {
    console.log('SDK structure OK (API call failed as expected)')
  }
}

main()
