const fs = require('fs/promises')
const path = require('path')
const { publicApiUrl } = require('../config/env')

const uploadRoot = path.resolve(__dirname, '../../uploads')

const saveFile = async (relativePath, buffer) => {
  const normalizedPath = relativePath.split('/').join(path.sep)
  const absolutePath = path.resolve(uploadRoot, normalizedPath)
  if (!absolutePath.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new Error('Invalid storage path.')
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, buffer)
  return {
    absolutePath,
    publicUrl: `${publicApiUrl}/uploads/${relativePath.split(path.sep).join('/')}`,
  }
}

const removeFile = async (relativePath) => {
  const normalizedPath = relativePath.split('/').join(path.sep)
  const absolutePath = path.resolve(uploadRoot, normalizedPath)
  if (!absolutePath.startsWith(`${uploadRoot}${path.sep}`)) return
  await fs.rm(absolutePath, { force: true })
}

module.exports = {
  uploadRoot,
  saveFile,
  removeFile,
}
