;; Quantum Field Adjustment Consensus Contract
;; Establishes consensus for adjusting quantum fields

;; Error codes
(define-constant ERR_UNAUTHORIZED u100)
(define-constant ERR_ALREADY_REGISTERED u101)
(define-constant ERR_NOT_FOUND u102)
(define-constant ERR_VOTING_CLOSED u103)
(define-constant ERR_ALREADY_VOTED u104)
(define-constant ERR_THRESHOLD_NOT_MET u105)

;; Data maps
(define-map quantum-fields
  { field-id: (string-ascii 64) }
  {
    description: (string-ascii 256),
    current-value: int,
    baseline-value: int,
    stability-index: uint,
    last-adjusted: uint,
    adjustment-count: uint
  }
)

(define-map adjustment-proposals
  { proposal-id: (string-ascii 64) }
  {
    field-id: (string-ascii 64),
    proposed-value: int,
    justification: (string-ascii 256),
    proposer: principal,
    created-at: uint,
    status: (string-ascii 16), ;; "open", "approved", "rejected", "implemented"
    votes-for: uint,
    votes-against: uint,
    quorum-threshold: uint,
    voting-ends-at: uint
  }
)

(define-map votes
  {
    proposal-id: (string-ascii 64),
    voter: principal
  }
  {
    vote: bool, ;; true for, false against
    weight: uint,
    timestamp: uint,
    comment: (optional (string-ascii 256))
  }
)

(define-map field-observers
  {
    field-id: (string-ascii 64),
    observer: principal
  }
  {
    weight: uint,
    reputation: uint,
    last-observation: uint
  }
)

;; Public functions

;; Register a new quantum field
(define-public (register-field (field-id (string-ascii 64)) (description (string-ascii 256)) (initial-value int) (baseline-value int) (stability-index uint))
  (if (is-some (map-get? quantum-fields { field-id: field-id }))
    (err ERR_ALREADY_REGISTERED)
    (ok (map-set quantum-fields
      { field-id: field-id }
      {
        description: description,
        current-value: initial-value,
        baseline-value: baseline-value,
        stability-index: stability-index,
        last-adjusted: block-height,
        adjustment-count: u0
      }
    ))
  )
)

;; Create an adjustment proposal
(define-public (create-proposal (proposal-id (string-ascii 64)) (field-id (string-ascii 64)) (proposed-value int) (justification (string-ascii 256)) (quorum-threshold uint) (voting-duration uint))
  (let
    (
      (field (map-get? quantum-fields { field-id: field-id }))
    )
    (if (is-none field)
      (err ERR_NOT_FOUND)
      (ok (map-set adjustment-proposals
        { proposal-id: proposal-id }
        {
          field-id: field-id,
          proposed-value: proposed-value,
          justification: justification,
          proposer: tx-sender,
          created-at: block-height,
          status: "open",
          votes-for: u0,
          votes-against: u0,
          quorum-threshold: quorum-threshold,
          voting-ends-at: (+ block-height voting-duration)
        }
      ))
    )
  )
)

;; Vote on a proposal
(define-public (vote-on-proposal (proposal-id (string-ascii 64)) (vote bool) (weight uint) (comment (optional (string-ascii 256))))
  (let
    (
      (proposal (map-get? adjustment-proposals { proposal-id: proposal-id }))
      (existing-vote (map-get? votes { proposal-id: proposal-id, voter: tx-sender }))
    )
    (if (is-none proposal)
      (err ERR_NOT_FOUND)
      (if (> block-height (get voting-ends-at (unwrap-panic proposal)))
        (err ERR_VOTING_CLOSED)
        (if (is-some existing-vote)
          (err ERR_ALREADY_VOTED)
          (begin
            (map-set votes
              { proposal-id: proposal-id, voter: tx-sender }
              {
                vote: vote,
                weight: weight,
                timestamp: block-height,
                comment: comment
              }
            )
            (ok (map-set adjustment-proposals
              { proposal-id: proposal-id }
              (merge (unwrap-panic proposal)
                {
                  votes-for: (if vote
                               (+ (get votes-for (unwrap-panic proposal)) weight)
                               (get votes-for (unwrap-panic proposal))
                             ),
                  votes-against: (if vote
                                   (get votes-against (unwrap-panic proposal))
                                   (+ (get votes-against (unwrap-panic proposal)) weight)
                                 )
                }
              )
            ))
          )
        )
      )
    )
  )
)

;; Finalize a proposal
(define-public (finalize-proposal (proposal-id (string-ascii 64)))
  (let
    (
      (proposal (map-get? adjustment-proposals { proposal-id: proposal-id }))
      (field-id (get field-id (default-to { field-id: "" } proposal)))
      (field (map-get? quantum-fields { field-id: field-id }))
      (total-votes (+ (get votes-for (default-to { votes-for: u0 } proposal))
                      (get votes-against (default-to { votes-against: u0 } proposal))))
      (quorum-met (>= total-votes (get quorum-threshold (default-to { quorum-threshold: u0 } proposal))))
      (proposal-approved (> (get votes-for (default-to { votes-for: u0 } proposal))
                           (get votes-against (default-to { votes-against: u0 } proposal))))
    )
    (if (is-none proposal)
      (err ERR_NOT_FOUND)
      (if (< block-height (get voting-ends-at (unwrap-panic proposal)))
        (err ERR_VOTING_CLOSED)
        (if (not quorum-met)
          (err ERR_THRESHOLD_NOT_MET)
          (begin
            (map-set adjustment-proposals
              { proposal-id: proposal-id }
              (merge (unwrap-panic proposal)
                {
                  status: (if proposal-approved "approved" "rejected")
                }
              )
            )
            (if (and proposal-approved (is-some field))
              (map-set quantum-fields
                { field-id: field-id }
                (merge (unwrap-panic field)
                  {
                    current-value: (get proposed-value (unwrap-panic proposal)),
                    last-adjusted: block-height,
                    adjustment-count: (+ (get adjustment-count (unwrap-panic field)) u1)
                  }
                )
              )
              true
            )
            (ok proposal-approved)
          )
        )
      )
    )
  )
)

;; Register as a field observer
(define-public (register-observer (field-id (string-ascii 64)) (weight uint))
  (let
    (
      (field (map-get? quantum-fields { field-id: field-id }))
    )
    (if (is-none field)
      (err ERR_NOT_FOUND)
      (ok (map-set field-observers
        { field-id: field-id, observer: tx-sender }
        {
          weight: weight,
          reputation: u50, ;; Default starting reputation
          last-observation: block-height
        }
      ))
    )
  )
)

;; Update observer reputation
(define-public (update-observer-reputation (field-id (string-ascii 64)) (observer principal) (new-reputation uint))
  (let
    (
      (observer-data (map-get? field-observers { field-id: field-id, observer: observer }))
    )
    (if (is-none observer-data)
      (err ERR_NOT_FOUND)
      (ok (map-set field-observers
        { field-id: field-id, observer: observer }
        (merge (unwrap-panic observer-data)
          {
            reputation: new-reputation,
            last-observation: block-height
          }
        )
      ))
    )
  )
)

;; Get field details
(define-read-only (get-field (field-id (string-ascii 64)))
  (map-get? quantum-fields { field-id: field-id })
)

;; Get proposal details
(define-read-only (get-proposal (proposal-id (string-ascii 64)))
  (map-get? adjustment-proposals { proposal-id: proposal-id })
)

;; Get vote details
(define-read-only (get-vote (proposal-id (string-ascii 64)) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

;; Get observer details
(define-read-only (get-observer (field-id (string-ascii 64)) (observer principal))
  (map-get? field-observers { field-id: field-id, observer: observer })
)

;; Calculate field stability
(define-read-only (calculate-field-stability (field-id (string-ascii 64)))
  (let
    (
      (field (map-get? quantum-fields { field-id: field-id }))
      (current (get current-value (default-to { current-value: 0 } field)))
      (baseline (get baseline-value (default-to { baseline-value: 0 } field)))
      (stability (get stability-index (default-to { stability-index: u50 } field)))
    )
    (if (is-eq baseline 0)
      stability
      (- u100 (min u100 (/ (* (abs (- current baseline)) u100) (abs baseline))))
    )
  )
)

