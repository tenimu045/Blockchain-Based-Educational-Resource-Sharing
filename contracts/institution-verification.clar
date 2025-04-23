;; Institution Verification Contract
;; This contract validates legitimate educational entities

(define-data-var admin principal tx-sender)

;; Map to store verified institutions
(define-map verified-institutions
  principal
  {
    name: (string-utf8 100),
    website: (string-utf8 100),
    verified-at: uint,
    active: bool
  }
)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Verify a new institution
(define-public (verify-institution (institution principal) (name (string-utf8 100)) (website (string-utf8 100)))
  (begin
    (asserts! (is-admin) (err u403))
    (asserts! (not (is-some (map-get? verified-institutions institution))) (err u100))
    (ok (map-set verified-institutions
      institution
      {
        name: name,
        website: website,
        verified-at: block-height,
        active: true
      }
    ))
  )
)

;; Revoke verification
(define-public (revoke-verification (institution principal))
  (begin
    (asserts! (is-admin) (err u403))
    (asserts! (is-some (map-get? verified-institutions institution)) (err u404))
    (ok (map-set verified-institutions
      institution
      (merge (unwrap-panic (map-get? verified-institutions institution))
        { active: false })
    ))
  )
)

;; Check if an institution is verified
(define-read-only (is-verified (institution principal))
  (match (map-get? verified-institutions institution)
    institution-data (ok (get active institution-data))
    (err u404)
  )
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err u403))
    (ok (var-set admin new-admin))
  )
)
