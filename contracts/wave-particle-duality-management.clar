;; Wave-Particle Duality Management Contract
;; Manages the dual nature of quantum entities

;; Error codes
(define-constant ERR_UNAUTHORIZED u100)
(define-constant ERR_ALREADY_REGISTERED u101)
(define-constant ERR_NOT_FOUND u102)
(define-constant ERR_INVALID_STATE u103)
(define-constant ERR_OBSERVATION_CONFLICT u104)

;; Data maps
(define-map quantum-entities
  { entity-id: (string-ascii 64) }
  {
    description: (string-ascii 256),
    current-state: (string-ascii 16), ;; "wave", "particle", or "superposition"
    wave-probability: uint, ;; 0-100 representing percentage
    last-observed: uint,
    observer-id: (optional (string-ascii 64)),
    stability-factor: uint
  }
)

(define-map observation-events
  {
    entity-id: (string-ascii 64),
    observation-id: (string-ascii 64)
  }
  {
    observer-id: (string-ascii 64),
    observed-state: (string-ascii 16),
    timestamp: uint,
    measurement-type: (string-ascii 32),
    certainty-level: uint
  }
)

(define-map state-transitions
  {
    entity-id: (string-ascii 64),
    transition-id: (string-ascii 64)
  }
  {
    from-state: (string-ascii 16),
    to-state: (string-ascii 16),
    trigger: (string-ascii 32),
    timestamp: uint,
    energy-change: int
  }
)

;; Public functions

;; Register a new quantum entity
(define-public (register-entity (entity-id (string-ascii 64)) (description (string-ascii 256)) (initial-state (string-ascii 16)) (wave-probability uint) (stability-factor uint))
  (if (is-some (map-get? quantum-entities { entity-id: entity-id }))
    (err ERR_ALREADY_REGISTERED)
    (if (or (not (is-valid-state initial-state)) (> wave-probability u100))
      (err ERR_INVALID_STATE)
      (ok (map-set quantum-entities
        { entity-id: entity-id }
        {
          description: description,
          current-state: initial-state,
          wave-probability: wave-probability,
          last-observed: u0,
          observer-id: none,
          stability-factor: stability-factor
        }
      ))
    )
  )
)

;; Record an observation of a quantum entity
(define-public (record-observation (entity-id (string-ascii 64)) (observation-id (string-ascii 64)) (observer-id (string-ascii 64)) (observed-state (string-ascii 16)) (measurement-type (string-ascii 32)) (certainty-level uint))
  (let
    (
      (entity (map-get? quantum-entities { entity-id: entity-id }))
    )
    (if (is-none entity)
      (err ERR_NOT_FOUND)
      (if (not (is-valid-state observed-state))
        (err ERR_INVALID_STATE)
        (begin
          (map-set observation-events
            {
              entity-id: entity-id,
              observation-id: observation-id
            }
            {
              observer-id: observer-id,
              observed-state: observed-state,
              timestamp: block-height,
              measurement-type: measurement-type,
              certainty-level: certainty-level
            }
          )
          (ok (map-set quantum-entities
            { entity-id: entity-id }
            (merge (unwrap-panic entity)
              {
                current-state: observed-state,
                last-observed: block-height,
                observer-id: (some observer-id)
              }
            )
          ))
        )
      )
    )
  )
)

;; Record a state transition
(define-public (record-transition (entity-id (string-ascii 64)) (transition-id (string-ascii 64)) (from-state (string-ascii 16)) (to-state (string-ascii 16)) (trigger (string-ascii 32)) (energy-change int))
  (let
    (
      (entity (map-get? quantum-entities { entity-id: entity-id }))
    )
    (if (is-none entity)
      (err ERR_NOT_FOUND)
      (if (or (not (is-valid-state from-state)) (not (is-valid-state to-state)))
        (err ERR_INVALID_STATE)
        (begin
          (map-set state-transitions
            {
              entity-id: entity-id,
              transition-id: transition-id
            }
            {
              from-state: from-state,
              to-state: to-state,
              trigger: trigger,
              timestamp: block-height,
              energy-change: energy-change
            }
          )
          (ok (map-set quantum-entities
            { entity-id: entity-id }
            (merge (unwrap-panic entity)
              {
                current-state: to-state,
                last-observed: block-height
              }
            )
          ))
        )
      )
    )
  )
)

;; Update wave probability
(define-public (update-wave-probability (entity-id (string-ascii 64)) (new-probability uint))
  (let
    (
      (entity (map-get? quantum-entities { entity-id: entity-id }))
    )
    (if (is-none entity)
      (err ERR_NOT_FOUND)
      (if (> new-probability u100)
        (err ERR_INVALID_STATE)
        (ok (map-set quantum-entities
          { entity-id: entity-id }
          (merge (unwrap-panic entity)
            {
              wave-probability: new-probability
            }
          )
        ))
      )
    )
  )
)

;; Helper function to check if a state is valid
(define-private (is-valid-state (state (string-ascii 16)))
  (or (is-eq state "wave") (is-eq state "particle") (is-eq state "superposition"))
)

;; Get entity details
(define-read-only (get-entity (entity-id (string-ascii 64)))
  (map-get? quantum-entities { entity-id: entity-id })
)

;; Get observation event
(define-read-only (get-observation (entity-id (string-ascii 64)) (observation-id (string-ascii 64)))
  (map-get? observation-events { entity-id: entity-id, observation-id: observation-id })
)

;; Get state transition
(define-read-only (get-transition (entity-id (string-ascii 64)) (transition-id (string-ascii 64)))
  (map-get? state-transitions { entity-id: entity-id, transition-id: transition-id })
)

;; Calculate collapse probability based on stability factor
(define-read-only (calculate-collapse-probability (entity-id (string-ascii 64)))
  (let
    (
      (entity (map-get? quantum-entities { entity-id: entity-id }))
      (stability (get stability-factor (default-to { stability-factor: u50 } entity)))
      (wave-prob (get wave-probability (default-to { wave-probability: u50 } entity)))
    )
    (if (is-eq (get current-state (default-to { current-state: "superposition" } entity)) "superposition")
      (/ (* wave-prob (- u100 stability)) u100)
      u0
    )
  )
)

