import { Clarinet, Tx, type Chain, type Account, types } from "https://deno.land/x/clarinet@v1.0.0/index.ts"
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts"

Clarinet.test({
  name: "Quantum Fluctuation Regulation Contract - Register a zone and verify its details",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    
    // Register a new fluctuation zone
    const block = chain.mineBlock([
      Tx.contractCall(
          "quantum-fluctuation-regulation",
          "register-zone",
          [
            types.ascii("vacuum-zone-alpha"),
            types.ascii("Quantum vacuum fluctuation zone in sector alpha"),
            types.uint(1000),
            types.uint(500),
            types.uint(75),
          ],
          deployer.address,
      ),
    ])
    
    // Check that the transaction was successful
    assertEquals(block.receipts.length, 1)
    assertEquals(block.receipts[0].result.expectOk(), true)
    
    // Get the zone details and verify
    const getZoneResult = chain.callReadOnlyFn(
        "quantum-fluctuation-regulation",
        "get-zone",
        [types.ascii("vacuum-zone-alpha")],
        deployer.address,
    )
    
    const zoneData = getZoneResult.result.expectSome().expectTuple()
    assertEquals(zoneData["description"], types.ascii("Quantum vacuum fluctuation zone in sector alpha"))
    assertEquals(zoneData["max-amplitude"], types.uint(1000))
    assertEquals(zoneData["baseline-energy"], types.uint(500))
    assertEquals(zoneData["regulation-level"], types.uint(75))
    assertEquals(zoneData["status"], types.ascii("active"))
  },
})

Clarinet.test({
  name: "Quantum Fluctuation Regulation Contract - Record a fluctuation event",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    
    // Register a zone first
    chain.mineBlock([
      Tx.contractCall(
          "quantum-fluctuation-regulation",
          "register-zone",
          [
            types.ascii("vacuum-zone-beta"),
            types.ascii("Quantum vacuum fluctuation zone in sector beta"),
            types.uint(1000),
            types.uint(500),
            types.uint(75),
          ],
          deployer.address,
      ),
    ])
    
    // Record a fluctuation event
    const block = chain.mineBlock([
      Tx.contractCall(
          "quantum-fluctuation-regulation",
          "record-fluctuation",
          [
            types.ascii("vacuum-zone-beta"),
            types.ascii("fluctuation-001"),
            types.uint(800),
            types.int(50),
            types.bool(true),
            types.ascii("energy spike regulated"),
          ],
          deployer.address,
      ),
    ])
    
    // Check that the transaction was successful
    assertEquals(block.receipts.length, 1)
    assertEquals(block.receipts[0].result.expectOk(), true)
    
    // Get the fluctuation event and verify
    const getFluctuationResult = chain.callReadOnlyFn(
        "quantum-fluctuation-regulation",
        "get-fluctuation-event",
        [types.ascii("vacuum-zone-beta"), types.ascii("fluctuation-001")],
        deployer.address,
    )
    
    const fluctuationData = getFluctuationResult.result.expectSome().expectTuple()
    assertEquals(fluctuationData["amplitude"], types.uint(800))
    assertEquals(fluctuationData["energy-delta"], types.int(50))
    assertEquals(fluctuationData["regulated"], types.bool(true))
    assertEquals(fluctuationData["outcome"], types.ascii("energy spike regulated"))
  },
})

Clarinet.test({
  name: "Quantum Fluctuation Regulation Contract - Create a regulation policy",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    
    // Create a regulation policy
    const block = chain.mineBlock([
      Tx.contractCall(
          "quantum-fluctuation-regulation",
          "create-policy",
          [
            types.ascii("policy-standard"),
            types.ascii("Standard regulation policy for vacuum fluctuations"),
            types.uint(750),
            types.ascii("energy-dampening"),
            types.uint(10),
          ],
          deployer.address,
      ),
    ])
    
    // Check that the transaction was successful
    assertEquals(block.receipts.length, 1)
    assertEquals(block.receipts[0].result.expectOk(), true)
    
    // Get the policy and verify
    const getPolicyResult = chain.callReadOnlyFn(
        "quantum-fluctuation-regulation",
        "get-policy",
        [types.ascii("policy-standard")],
        deployer.address,
    )
    
    const policyData = getPolicyResult.result.expectSome().expectTuple()
    assertEquals(policyData["description"], types.ascii("Standard regulation policy for vacuum fluctuations"))
    assertEquals(policyData["threshold-amplitude"], types.uint(750))
    assertEquals(policyData["intervention-method"], types.ascii("energy-dampening"))
    assertEquals(policyData["cooldown-period"], types.uint(10))
    assertEquals(policyData["active"], types.bool(true))
  },
})

