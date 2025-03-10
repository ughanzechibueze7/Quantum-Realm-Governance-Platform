import { Clarinet, Tx, type Chain, type Account, types } from "https://deno.land/x/clarinet@v1.0.0/index.ts"
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts"

Clarinet.test({
  name: "Quantum Field Adjustment Consensus Contract - Register a quantum field and verify its details",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    
    // Register a new quantum field
    const block = chain.mineBlock([
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "register-field",
          [
            types.ascii("higgs-field-001"),
            types.ascii("Standard Higgs field with normal parameters"),
            types.int(246),
            types.int(246),
            types.uint(95),
          ],
          deployer.address,
      ),
    ])
    
    // Check that the transaction was successful
    assertEquals(block.receipts.length, 1)
    assertEquals(block.receipts[0].result.expectOk(), true)
    
    // Get the field details and verify
    const getFieldResult = chain.callReadOnlyFn(
        "quantum-field-adjustment-consensus",
        "get-field",
        [types.ascii("higgs-field-001")],
        deployer.address,
    )
    
    const fieldData = getFieldResult.result.expectSome().expectTuple()
    assertEquals(fieldData["description"], types.ascii("Standard Higgs field with normal parameters"))
    assertEquals(fieldData["current-value"], types.int(246))
    assertEquals(fieldData["baseline-value"], types.int(246))
    assertEquals(fieldData["stability-index"], types.uint(95))
    assertEquals(fieldData["adjustment-count"], types.uint(0))
  },
})

Clarinet.test({
  name: "Quantum Field Adjustment Consensus Contract - Create a proposal and vote on it",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet1 = accounts.get("wallet_1")!
    const wallet2 = accounts.get("wallet_2")!
    
    // Register a field first
    chain.mineBlock([
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "register-field",
          [
            types.ascii("higgs-field-002"),
            types.ascii("Standard Higgs field with normal parameters"),
            types.int(246),
            types.int(246),
            types.uint(95),
          ],
          deployer.address,
      ),
    ])
    
    // Create a proposal
    const block1 = chain.mineBlock([
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "create-proposal",
          [
            types.ascii("proposal-001"),
            types.ascii("higgs-field-002"),
            types.int(250),
            types.ascii("Slight increase to test stability"),
            types.uint(100),
            types.uint(10),
          ],
          deployer.address,
      ),
    ])
    
    // Check that the transaction was successful
    assertEquals(block1.receipts.length, 1)
    assertEquals(block1.receipts[0].result.expectOk(), true)
    
    // Vote on the proposal
    const block2 = chain.mineBlock([
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "vote-on-proposal",
          [
            types.ascii("proposal-001"),
            types.bool(true),
            types.uint(60),
            types.some(types.ascii("I support this adjustment")),
          ],
          wallet1.address,
      ),
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "vote-on-proposal",
          [
            types.ascii("proposal-001"),
            types.bool(false),
            types.uint(40),
            types.some(types.ascii("I have concerns about stability")),
          ],
          wallet2.address,
      ),
    ])
    
    // Check that the votes were successful
    assertEquals(block2.receipts.length, 2)
    assertEquals(block2.receipts[0].result.expectOk(), true)
    assertEquals(block2.receipts[1].result.expectOk(), true)
    
    // Get the proposal and verify votes
    const getProposalResult = chain.callReadOnlyFn(
        "quantum-field-adjustment-consensus",
        "get-proposal",
        [types.ascii("proposal-001")],
        deployer.address,
    )
    
    const proposalData = getProposalResult.result.expectSome().expectTuple()
    assertEquals(proposalData["field-id"], types.ascii("higgs-field-002"))
    assertEquals(proposalData["proposed-value"], types.int(250))
    assertEquals(proposalData["votes-for"], types.uint(60))
    assertEquals(proposalData["votes-against"], types.uint(40))
    assertEquals(proposalData["status"], types.ascii("open"))
  },
})

Clarinet.test({
  name: "Quantum Field Adjustment Consensus Contract - Finalize a proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet1 = accounts.get("wallet_1")!
    
    // Register a field first
    chain.mineBlock([
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "register-field",
          [
            types.ascii("higgs-field-003"),
            types.ascii("Standard Higgs field with normal parameters"),
            types.int(246),
            types.int(246),
            types.uint(95),
          ],
          deployer.address,
      ),
    ])
    
    // Create a proposal with short voting period
    chain.mineBlock([
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "create-proposal",
          [
            types.ascii("proposal-002"),
            types.ascii("higgs-field-003"),
            types.int(240),
            types.ascii("Slight decrease to test stability"),
            types.uint(50),
            types.uint(1),
          ],
          deployer.address,
      ),
    ])
    
    // Vote on the proposal
    chain.mineBlock([
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "vote-on-proposal",
          [
            types.ascii("proposal-002"),
            types.bool(true),
            types.uint(60),
            types.some(types.ascii("I support this adjustment")),
          ],
          wallet1.address,
      ),
    ])
    
    // Mine a block to pass the voting period
    chain.mineBlock([])
    
    // Finalize the proposal
    const finalizeBlock = chain.mineBlock([
      Tx.contractCall(
          "quantum-field-adjustment-consensus",
          "finalize-proposal",
          [types.ascii("proposal-002")],
          deployer.address,
      ),
    ])
    
    // Check that the finalization was successful
    assertEquals(finalizeBlock.receipts.length, 1)
    assertEquals(finalizeBlock.receipts[0].result.expectOk(), types.bool(true))
    
    // Get the proposal and verify it was approved
    const getProposalResult = chain.callReadOnlyFn(
        "quantum-field-adjustment-consensus",
        "get-proposal",
        [types.ascii("proposal-002")],
        deployer.address,
    )
    
    const proposalData = getProposalResult.result.expectSome().expectTuple()
    assertEquals(proposalData["status"], types.ascii("approved"))
    
    // Get the field and verify it was updated
    const getFieldResult = chain.callReadOnlyFn(
        "quantum-field-adjustment-consensus",
        "get-field",
        [types.ascii("higgs-field-003")],
        deployer.address,
    )
    
    const fieldData = getFieldResult.result.expectSome().expectTuple()
    assertEquals(fieldData["current-value"], types.int(240))
    assertEquals(fieldData["adjustment-count"], types.uint(1))
  },
})

