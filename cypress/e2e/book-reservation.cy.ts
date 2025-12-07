/// <reference types="cypress" />

interface Reservation {
	bookingPage: string
	partySize: number
	desiredTimeSlots: string[]
	excludedDays: string[]
	includedDays: string[]
	dryRun: boolean
}

interface Patron {
	email: string
	password: string
	cvv: string
}

interface Booking {
	day: string
	time: string
}

describe('book reservation', () => {
	
	let patron: Patron
	let reservation: Reservation
	
	before(() => {
		patron = {
			email: Cypress.env('email'),
			password: Cypress.env('password'),
			cvv: Cypress.env('cvv'),
		}
		cy.wrap(patron.email).should('be.ok')
		cy.wrap(patron.password).should('be.ok')
		cy.wrap(patron.cvv).should('be.a', 'string')
		cy.wrap(patron.cvv).should('match', /^[0-9]{3,4}$/)

		reservation = {
			partySize: Cypress.env('partySize'),
			bookingPage: Cypress.env('bookingPage'),
			desiredTimeSlots: Cypress.env('desiredTimeSlots'),
			excludedDays: Cypress.env('excludedDays'),
			includedDays: Cypress.env('includedDays'),
			dryRun: Cypress.env('dryRun'),
		}
		cy.wrap(reservation.bookingPage).should('be.ok')
		cy.wrap(reservation.partySize).should('be.a', 'number')
		cy.wrap(reservation.dryRun).should('be.a', 'boolean')
		cy.wrap(reservation.desiredTimeSlots).should('be.a', 'array')
		cy.wrap(reservation.excludedDays).should('be.a', 'array')
		cy.wrap(reservation.includedDays).should('be.a', 'array')

	})

	const tid = (id:string, eq:string = '=') => `[data-testid${eq}${id}]`

	function closeTrusteModal() {
		if (!Cypress.env('trustee')) return
		cy.log(':cookie: closing truste modal...')
		return cy
			.get('#truste-consent-required')
			.click() 
	}

	function fetchAvailableDays() {
		cy.log(':mag: checking for days with openings...')
		return cy
			.get(tid('consumer-calendar-day'))
			.filter('[aria-disabled=false].is-available')
			.then((days) => cy.wrap(
				days.filter((i, el) => {
					const dayLabel = el.ariaLabel
					const isExcluded = reservation.excludedDays.length > 0 && reservation.excludedDays.indexOf(dayLabel) >= 0
					const isIncluded = reservation.includedDays.length === 0 || reservation.includedDays.indexOf(dayLabel) >= 0
					return !isExcluded && isIncluded
				})
			))
	}

	function findMatchingTimeSlot(days:Array<HTMLElement>) {
		cy.wrap(days.length).should('be.greaterThan', 0) 
		cy.wrap(days[0]).click()
		return cy.get(`${tid('search-result-time')} span`).then((results) => {
			cy.log(`:crossed_fingers: checking ${results.length} slots on ${days[0].ariaLabel} for a match...`)
			const matchedPreferences = results
				.filter((i, el) => 
					reservation.desiredTimeSlots.length === 0 ||
					reservation.desiredTimeSlots.indexOf(el.innerText) >= 0)
			if (matchedPreferences.length === 0) {
				return findMatchingTimeSlot(days.slice(1))
			} else {
				return cy.wrap({
					booking: {
						day: days[0].ariaLabel,
						time: matchedPreferences[0].innerText
					},
					timeSlot: matchedPreferences[0]
				})
			}
		})
	}

	function authenticate() {
	  cy.log('🔍 Waiting for Cloudflare/Page Load...');
	
	  // 1. THE "PATIENCE" WAIT (15s)
	  // Often Cloudflare validates you automatically if you just wait.
	  cy.wait(15000);
	
	  // 2. CLICK THE CHECKBOX (If it exists)
	  // Because we enabled 'includeShadowDom', this simple check might work now.
	  cy.get('body').then(($body) => {
	    if ($body.find('iframe[src*="turnstile"]').length > 0) {
	      cy.log('⚠️ Attempting to click Cloudflare Turnstile...');
	      // Try to click the iframe wrapper (often triggers the check)
	      cy.get('iframe[src*="turnstile"]').click({ force: true });
	      cy.wait(5000);
	    }
	  });
	
	  // 3. ATTEMPT LOGIN (Even if "Verify" text is still there)
	  // Sometimes the text remains hidden in the background, so we just try to find the email input anyway.
	  cy.get('body').then(($body) => {
	    // Look for ANY email input
	    if ($body.find('input[type="email"]').length > 0) {
	      cy.get('input[type="email"]').type(Cypress.env('email'));
	    } else {
	      // If we still can't find it, we take a final screenshot and fail.
	      cy.screenshot('final-block-failure'); 
	      throw new Error('Still blocked by Cloudflare after waiting 20s. See "final-block-failure" screenshot.');
	    }
	  });

	  // 4. CONTINUE & PASSWORD
	  cy.get('body').then(($body) => {
	    if ($body.find('button:contains("Continue")').length > 0) {
	      cy.contains('button', 'Continue').click();
	      cy.wait(1000);
	    }
	  });
	
	  cy.get('input[type="password"]', { timeout: 10000 }).type(Cypress.env('password'));
	  cy.get('button[type="submit"], button:contains("Log in")').first().click();
	  cy.wait(5000);
}

	function visit() {
		const redirect = encodeURIComponent(`${reservation.bookingPage}?size=${reservation.partySize}`)
		// REPLACE THE OLD cy.visit LINE WITH THIS BLOCK:
	    cy.visit(Cypress.env('bookingPage'), {
	      failOnStatusCode: false, // We ONLY keep this one. It forces the bot to continue even if Tock sends a 403.
	      headers: {
	        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	      },
	      onBeforeLoad(win) {
	        Object.defineProperty(win.navigator, 'webdriver', {
	          get: () => false,
	        });
	      }
	    });
	    
	    // Allow time for the "Just a moment" screen to resolve
	    cy.wait(5000);
	}

	function fillFormFields(timeSlot:HTMLElement) {
		cy.wrap(timeSlot).click()
		return cy.get('.Consumer-contentContainer').then((body) => {
			const root = body.find('span#cvv')
			if (root.length) {
				cy.log(':credit_card: completing payment form...')
				cy.intercept('https://payments.braintree-api.com/graphql').as('braintree')
				cy.wait('@braintree')
				cy.get('iframe[type=cvv]')
					.its('0.contentDocument.body')
					.find('#cvv')
					.type(patron.cvv)
			} else {
				cy.log(':money_with_wings: no deposit required...')	
			}
			return cy.wrap(root.length > 0)
		})
	}

	function submitBooking() {
		cy.log(':handshake: booking reservation...')
		if (reservation.dryRun) {
			return cy.wrap('not booked, dry run mode enabled...')
		} else {		
			cy.get('[data-testid="purchase-button"]').click()
			return cy.get('[data-testid="receipt-confirmation-id"]', { timeout: 10000 }).then(p => {
				return cy.wrap(`booked! ${p.text()}`)
			})
		}
	}

	let confirmation: string

	after(() => {
		if (confirmation) cy.log({
			color: 'good',
			text: `:calendar: <!channel> ${confirmation}`
		} as unknown as string)
		else cy.log({
			color: 'danger',
			text: ':cry: no reservation booked'
		} as unknown as string)
	})

	it('for first available time preference', () => {
		confirmation = ''
		visit()
		closeTrusteModal()
		authenticate()
		fetchAvailableDays().then((days) => {
			cy.log(`:raised_hands: found ${days.length} days available for booking...`)
			return findMatchingTimeSlot(Array.from(days))
		}).then(({ booking, timeSlot }) => {
			cy.log(`:white_check_mark: found time slot for ${booking.day} @ ${booking.time}...`)
			return fillFormFields(timeSlot)
		})
		submitBooking().then((msg) => {
			confirmation = msg
		})
	})
})
