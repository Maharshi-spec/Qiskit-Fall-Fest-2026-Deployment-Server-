const fs = require('fs/promises')
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
const {
  CERTIFICATE_TYPES,
  buildCertificateMeta,
  ensureTemplatePath,
  getCertificateTypeConfig,
  resolveTemplateSettings,
} = require('./certificate.utils')

const loadTemplatePdf = async (templatePath) => {
  const resolvedTemplatePath = ensureTemplatePath(templatePath)
  const templateBytes = await fs.readFile(resolvedTemplatePath)

  return {
    templatePath: resolvedTemplatePath,
    templateBytes,
  }
}

const preparePdfForDynamicText = async ({
  pdfDocument,
  certificateType,
  participantName,
  certificateId,
  registrationId,
  issueDate,
  templateConfig = {},
}) => {
  const templateMeta = buildCertificateMeta({
    participantName,
    certificateId,
    registrationId,
    issueDate,
    certificateType,
  })

  const typeConfig = getCertificateTypeConfig(templateMeta.certificateType)
  const resolvedSettings = resolveTemplateSettings({
    certificateType: templateMeta.certificateType,
    templateConfig,
  })

  const page = pdfDocument.getPages()[0]
  const { width, height } = page.getSize()
  const font = await pdfDocument.embedFont(StandardFonts.HelveticaBold)

  return {
    page,
    width,
    height,
    font,
    templateConfig: typeConfig,
    settings: resolvedSettings,
    metadata: templateMeta,
  }
}

const generateCertificate = async ({
  templatePath,
  participantName,
  certificateId,
  registrationId,
  issueDate,
  certificateType = CERTIFICATE_TYPES.GENERAL_EVENT_PARTICIPATION,
  templateConfig = {},
} = {}) => {
  if (!templatePath) {
    throw new Error('templatePath is required to generate a certificate')
  }

  const { templateBytes, templatePath: resolvedTemplatePath } = await loadTemplatePdf(templatePath)
  const pdfDocument = await PDFDocument.load(templateBytes)

  const preparedDocument = await preparePdfForDynamicText({
    pdfDocument,
    certificateType,
    participantName,
    certificateId,
    registrationId,
    issueDate,
    templateConfig,
  })

  const { page, width, height, font, settings, metadata } = preparedDocument

  const nameAreaLeft = width * 0.236
  const nameAreaRight = width * 0.783
  const nameAreaWidth = nameAreaRight - nameAreaLeft
  const renderedParticipantName = metadata.participantName.toUpperCase()
  const participantTextWidthAtUnitSize = font.widthOfTextAtSize(renderedParticipantName, 1)
  const participantFontSize = metadata.certificateType === CERTIFICATE_TYPES.HACKATHON_PARTICIPATION
    ? 24
    : settings.fontSize
  const nameFontSize = Math.min(participantFontSize, (nameAreaWidth * 0.92) / participantTextWidthAtUnitSize)
  const participantTextWidth = font.widthOfTextAtSize(renderedParticipantName, nameFontSize)
  const participantX = nameAreaLeft + Math.max(0, (nameAreaWidth - participantTextWidth) / 2)
  const participantY = height * 0.539

  page.drawText(renderedParticipantName, {
    x: participantX,
    y: participantY,
    size: nameFontSize,
    font,
    color: rgb(...settings.textColor),
  })

  const pdfBytes = await pdfDocument.save()

  return {
    certificateType: metadata.certificateType,
    templatePath: resolvedTemplatePath,
    fileName: `${metadata.certificateId}.pdf`,
    buffer: Buffer.from(pdfBytes),
    pdfBytes,
    metadata,
    layout: settings.layout,
  }
}

module.exports = {
  generateCertificate,
  loadTemplatePdf,
  preparePdfForDynamicText,
  CERTIFICATE_TYPES,
}
