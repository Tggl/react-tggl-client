import fs from 'fs/promises'

fs.readFile('src/TgglProvider.tsx', 'utf-8').then(
  async (code) => {
    const packageJson = await fs.readFile('package.json', 'utf-8')
    const version = JSON.parse(packageJson).version

    await fs.writeFile('src/TgglProvider.tsx', code.replace(/export const PACKAGE_VERSION = '[0-9.]+'/, `export const PACKAGE_VERSION = '${version}'`))
  }
)
