const test = require('node:test')
const assert = require('node:assert/strict')
const {
  CERTIFICATE_TYPES,
  getCertificateTypeConfig,
  ensureCertificateType,
} = require('../src/utils/certificate.utils')

test('approved certificate types resolve to the exact local templates', () => {
  const expected = {
    GENERAL_EVENT_PARTICIPATION: 'Event_Participant.pdf',
    HACKATHON_PARTICIPATION: 'Hackathon_Participant.pdf',
    WEBINAR_PARTICIPATION: 'Webiner_Participant.pdf',
    WORKSHOP_PARTICIPATION: 'Workshop_Participant.pdf',
    QUANTUM_BOOTCAMP_COMPLETION: 'BootCamp_Participant.pdf',
    HACKATHON_FIRST_POSITION: '1stPlace_Hackathon.pdf',
    HACKATHON_FIRST_RUNNERS_UP: '1stRunnerUp_Hackathon.pdf',
    HACKATHON_SECOND_RUNNERS_UP: '2ndRunnerUp_Hackathon.pdf',
  }

  for (const [type, filename] of Object.entries(expected)) {
    assert.equal(ensureCertificateType(type), type)
    assert.equal(getCertificateTypeConfig(type).templateName, filename)
  }
})

test('hackathon participation resolves to the approved participant certificate type', () => {
  assert.equal(CERTIFICATE_TYPES.HACKATHON_PARTICIPATION, 'HACKATHON_PARTICIPATION')
})
