const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@': path.resolve(__dirname, 'src'),
}

config.watchFolders = [...(config.watchFolders || []), path.resolve(__dirname, 'src')]

module.exports = config
