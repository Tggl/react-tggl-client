<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://tggl.io/tggl-io-logo-white.svg">
    <img align="center" alt="Tggl Logo" src="https://tggl.io/tggl-io-logo-black.svg" width="200rem" />
  </picture>
</p>

<h1 align="center">Tggl React SDK</h1>

<p align="center">
  The React SDK can be used to evaluate flags and report usage to the Tggl API or a <a href="https://tggl.io/developers/evaluating-flags/tggl-proxy">proxy</a>.
</p>

<p align="center">
  <a href="https://tggl.io/">🔗 Website</a>
  •
  <a href="https://tggl.io/developers/sdks/react">📚 Documentation</a>
  •
  <a href="https://www.npmjs.com/package/react-tggl-client">📦 NPM</a>
  •
  <a href="https://www.youtube.com/@Tggl-io">🎥 Videos</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/Tggl/react-tggl-client/ci.yml" alt="GitHub Workflow Status (with event)" />
  <img src="https://img.shields.io/coverallsCoverage/github/Tggl/react-tggl-client" alt="Coveralls branch" />
  <img src="https://img.shields.io/npm/v/react-tggl-client" alt="npm" />
</p>

## Usage

Install the dependency:

```bash
npm i react-tggl-client
```

Add the provider to your app:

```tsx
import { TgglClient, TgglProvider } from 'react-tggl-client'

// Instanciate it outside of your component
const client = new TgglClient({ apiKey: 'YOUR_API_KEY' })

const App = () => {
  return (
    <TgglProvider client={client}>
      {/*...*/}
    </TgglProvider>
  )
}

```

Use the hook to evaluate flags:

```typescript
import { useFlag } from 'react-tggl-client'
 
const MyComponent = () => {
  const value = useFlag('myFlag', 'Varation A')
 
  //...
}
```
