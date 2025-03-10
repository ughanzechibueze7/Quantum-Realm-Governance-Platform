import { Clarinet, Tx, type Chain, type Account, types } from "https://deno.land/x/clarinet@v1.0.0/index.ts"
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts"

Clarinet.test({
  name: "Wave-Particle Duality Management Contract - Register a quantum entity and verify its details",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    
    // Register a new quantum entity
    const block = chain.mineBlock([
      Tx.contractCall(
          "wave-particle-duality-management",
          "register-entity",
          [
            types.ascii("photon-001"),
            types.ascii("Standard photon with dual nature"),
            types.ascii("superposition"),
            types.uint(50),
            types.uint(75),
          ],
          deployer.address,
      ),
    ])
    
    // Check that the transaction was successful
    assertEquals(block.receipts.length, 1)
    assertEquals(block.receipts[0].result.expectOk(), true)
    
    // Get the entity details and verify
    const getEntityResult = chain.callReadOnlyFn(
        "wave-particle-duality-management",
        "get-entity",
        [types.ascii("photon-001")],
        deployer.address,
    )
    
    const entityData = getEntityResult.result.expectSome().expectTuple()
    assertEquals(entityData["description"], types.ascii("Standard photon with dual nature"))
    assertEquals(entityData["current-state"], types.ascii("superposition"))
    assertEquals(entityData["wave-probability"], types.uint(50))
    assertEquals(entityData["stability-factor"], types.uint(75))
  },
})

Clarinet.test({
  name: "Wave-Particle Duality Management Contract - Record an observation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    
    // Register an entity first
    chain.mineBlock([
      Tx.contractCall(
          "wave-particle-duality-management",
          "register-entity",
          [
            types.ascii("photon-002"),
            types.ascii("Standard photon with dual nature"),
            types.ascii("superposition"),
            types.uint(50),
            types.uint(75),
          ],
          deployer.address,
      ),
    ])
    
    // Record an observation
    const block = chain.mineBlock([
      Tx.contractCall(
          "wave-particle-duality-management",
          "record-observation",
          [
            types.ascii("photon-002"),
            types.ascii("observation-001"),
            types.ascii("observer-alpha"),
            types.ascii("particle"),
            types.ascii("double-slit"),
            types.uint(90),
          ],
          deployer.address,
      ),
    ])
    
    // Check that the transaction was successful
    assertEquals(block.receipts.length, 1)
    assertEquals(block.receipts[0].result.expectOk(), true)
    
    // Get the observation and verify
    const getObservationResult = chain.callReadOnlyFn(
        "wave-particle-duality-management",
        "get-observation",
        [types.ascii("photon-002"), types.ascii("observation-001")],
        deployer.address,
    )
    
    const observationData = getObservationResult.result.expectSome().expectTuple()
    assertEquals(observationData["observer-id"], types.ascii("observer-alpha"))
    assertEquals(observationData["observed-state"], types.ascii("particle"))
    assertEquals(observationData["measurement-type"], types.ascii("double-slit"))
    assertEquals(observationData["certainty-level"], types.uint(90))
    
    // Verify the entity state was updated
    const getEntityResult = chain.callReadOnlyFn(
        "wave-particle-duality-management",
        "get-entity",
        [types.ascii("photon-002")],
        deployer.address,
    )
    
    const entityData = getEntityResult.result.expectSome().expectTuple()
    assertEquals(entityData["current-state"], types.ascii("particle"))
  },
})

Clarinet.test({
  name: "Wave-Particle Duality Management Contract - Record a state transition",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    
    // Register an entity first
    chain.mineBlock([
      Tx.contractCall(
          "wave-particle-duality-management",
          "register-entity",
          [
            types.ascii("photon-003"),
            types.ascii("Standard photon with dual nature"),
            types.ascii("wave"),
            types.uint(80),
            types.uint(60),
          ],
          deployer.address,
      ),
    ])
    
    // Record a state transition
    const block = chain.mineBlock([
      Tx.contractCall(
          "wave-particle-duality-management",
          "record-transition",
          [
            types.ascii("photon-003"),
            types.ascii("transition-001"),
            types.ascii("wave"),
            types.ascii("superposition"),
            types.ascii("quantum-tunneling"),
            types.int(25),
          ],
          deployer.address,
      ),
    ])
    
    // Check that the transaction was successful
    assertEquals(block.receipts.length, 1)
    assertEquals(block.receipts[0].result.expectOk(), true)
    
    // Get the transition and verify
    const getTransitionResult = chain.callReadOnlyFn(
        "wave-particle-duality-management",
        "get-transition",
        [types.ascii("photon-003"), types.ascii("transition-001")],
        deployer.address,
    )
    
    const transitionData = getTransitionResult.result.expectSome().expectTuple()
    assertEquals(transitionData["from-state"], types.ascii("wave"))
    assertEquals(transitionData["to-state"], types.ascii("superposition"))
    assertEquals(transitionData["trigger"], types.ascii("quantum-tunneling"))
    assertEquals(transitionData["energy-change"], types.int(25))
    
    // Verify the entity state was updated
    const getEntityResult = chain.callReadOnlyFn(
        "wave-particle-duality-management",
        "get-entity",
        [types.ascii("photon-003")],
        deployer.address,
    )
    
    const entityData = getEntityResult.result.expectSome().expectTuple()
    assertEquals(entityData["current-state"], types.ascii("superposition"))
  },
})

