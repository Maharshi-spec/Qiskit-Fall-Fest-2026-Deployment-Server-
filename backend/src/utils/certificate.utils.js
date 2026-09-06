const CERTIFICATE_TYPES = Object.freeze({
  GENERAL_EVENT_PARTICIPATION: 'GENERAL_EVENT_PARTICIPATION',
  HACKATHON_PARTICIPATION: 'HACKATHON_PARTICIPATION',
  WEBINAR_PARTICIPATION: 'WEBINAR_PARTICIPATION',
  WORKSHOP_PARTICIPATION: 'WORKSHOP_PARTICIPATION',
  QUANTUM_BOOTCAMP_COMPLETION: 'QUANTUM_BOOTCAMP_COMPLETION',
  HACKATHON_FIRST_POSITION: 'HACKATHON_FIRST_POSITION',
  HACKATHON_FIRST_RUNNERS_UP: 'HACKATHON_FIRST_RUNNERS_UP',
  HACKATHON_SECOND_RUNNERS_UP: 'HACKATHON_SECOND_RUNNERS_UP',
})

const CERTIFICATE_STORAGE_CONFIG = Object.freeze({
  bucketName: 'ID Cards',
  basePath: 'certificates',
  directories: {
    templates: 'certificates/templates',
    generated: 'certificates/generated',
  },
  templates: {
    [CERTIFICATE_TYPES.GENERAL_EVENT_PARTICIPATION]: 'Event_Participant.pdf',
    [CERTIFICATE_TYPES.HACKATHON_PARTICIPATION]: 'Hackathon_Participant.pdf',
    [CERTIFICATE_TYPES.WEBINAR_PARTICIPATION]: 'Webiner_Participant.pdf',
    [CERTIFICATE_TYPES.WORKSHOP_PARTICIPATION]: 'Workshop_Participant.pdf',
    [CERTIFICATE_TYPES.QUANTUM_BOOTCAMP_COMPLETION]: 'BootCamp_Participant.pdf',
    [CERTIFICATE_TYPES.HACKATHON_FIRST_POSITION]: '1stPlace_Hackathon.pdf',
    [CERTIFICATE_TYPES.HACKATHON_FIRST_RUNNERS_UP]: '1stRunnerUp_Hackathon.pdf',
    [CERTIFICATE_TYPES.HACKATHON_SECOND_RUNNERS_UP]: '2ndRunnerUp_Hackathon.pdf',
  },
})

const DEFAULT_TEMPLATE_LAYOUT = Object.freeze({
  participantName: {
    x: null,
    y: null,
    fontSize: null,
    align: 'center',
  },
  certificateId: {
    x: null,
    y: null,
    fontSize: null,
    align: 'left',
  },
  registrationId: {
    x: null,
    y: null,
    fontSize: null,
    align: 'left',
  },
  issueDate: {
    x: null,
    y: null,
    fontSize: null,
    align: 'left',
  },
})

const CERTIFICATE_TYPE_CONFIG = Object.freeze(Object.fromEntries(
  Object.entries(CERTIFICATE_STORAGE_CONFIG.templates).map(([certificateType, templateName]) => [certificateType, {
    label: templateName.replace(/\.pdf$/i, '').replace(/_/g, ' '),
    templateName,
    storagePath: templateName,
    layout: { ...DEFAULT_TEMPLATE_LAYOUT },
  }]),
))

const DEFAULT_TEMPLATE_SETTINGS = Object.freeze({
  fontSize: 18,
  mutedFontSize: 12,
  textColor: [0.12, 0.12, 0.12],
  accentedTextColor: [0.07, 0.07, 0.07],
})

const normalizeCertificateType = (certificateType) => {
  if (typeof certificateType !== 'string') {
    return CERTIFICATE_TYPES.GENERAL_EVENT_PARTICIPATION
  }

  return certificateType.trim().toUpperCase()
}

const ensureCertificateType = (certificateType) => {
  const type = normalizeCertificateType(certificateType)

  if (!Object.prototype.hasOwnProperty.call(CERTIFICATE_TYPE_CONFIG, type)) {
    throw new Error(`Unsupported certificate type: ${certificateType}. Supported types: ${Object.values(CERTIFICATE_TYPES).join(', ')}`)
  }

  return type
}

const normalizeIssueDate = (issueDate) => {
  const nextDate = issueDate ? new Date(issueDate) : new Date()

  if (Number.isNaN(nextDate.getTime())) {
    throw new Error('issueDate must be a valid date string or Date instance')
  }

  return nextDate.toISOString().split('T')[0]
}

const getCertificateTypeConfig = (certificateType) => {
  const type = ensureCertificateType(certificateType)
  return CERTIFICATE_TYPE_CONFIG[type]
}

const resolveCertificateTemplate = (certificateType) => {
  const type = ensureCertificateType(certificateType)
  return {
    certificateType: type,
    templateConfig: getCertificateTypeConfig(type),
    storagePath: CERTIFICATE_STORAGE_CONFIG.templates[type],
    bucketName: CERTIFICATE_STORAGE_CONFIG.bucketName,
    folderPath: CERTIFICATE_STORAGE_CONFIG.directories.templates,
  }
}

const resolveTemplateSettings = ({ certificateType, templateConfig = {} } = {}) => {
  const typeConfig = getCertificateTypeConfig(certificateType)
  const baseLayout = typeConfig.layout || DEFAULT_TEMPLATE_LAYOUT

  return {
    ...DEFAULT_TEMPLATE_SETTINGS,
    templateType: typeConfig.templateName,
    storagePath: typeConfig.storagePath,
    layout: {
      ...baseLayout,
      ...templateConfig,
    },
  }
}

const ensureTemplatePath = (templatePath) => {
  if (!templatePath || typeof templatePath !== 'string' || templatePath.trim() === '') {
    throw new Error('templatePath is required and must be a non-empty string')
  }

  return templatePath
}

const buildCertificateMeta = ({
  participantName,
  certificateId,
  registrationId,
  issueDate,
  certificateType,
}) => {
  if (!participantName || typeof participantName !== 'string' || participantName.trim() === '') {
    throw new Error('participantName is required')
  }

  if (!certificateId || typeof certificateId !== 'string' || certificateId.trim() === '') {
    throw new Error('certificateId is required')
  }

  if (!registrationId || typeof registrationId !== 'string' || registrationId.trim() === '') {
    throw new Error('registrationId is required')
  }

  return {
    participantName: participantName.trim(),
    certificateId: certificateId.trim(),
    registrationId: registrationId.trim(),
    issueDate: normalizeIssueDate(issueDate),
    certificateType: ensureCertificateType(certificateType),
  }
}

const buildCertificateDbRecord = ({
  registrationId,
  certificateType,
  participantName,
  participantEmail,
  certificateNumber,
  filePath = null,
  status = 'issued',
}) => {
  const type = ensureCertificateType(certificateType)

  return {
    certificate_number: certificateNumber,
    registration_id: registrationId,
    certificate_type: type,
    participant_name: participantName,
    participant_email: participantEmail,
    file_path: filePath,
    status,
  }
}

module.exports = {
  CERTIFICATE_TYPES,
  CERTIFICATE_TYPE_CONFIG,
  CERTIFICATE_STORAGE_CONFIG,
  DEFAULT_TEMPLATE_LAYOUT,
  DEFAULT_TEMPLATE_SETTINGS,
  ensureCertificateType,
  normalizeCertificateType,
  normalizeIssueDate,
  getCertificateTypeConfig,
  resolveCertificateTemplate,
  resolveTemplateSettings,
  ensureTemplatePath,
  buildCertificateMeta,
  buildCertificateDbRecord,
}
