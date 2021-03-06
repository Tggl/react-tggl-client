# Tggl React client

## Usage
Add the client to your dependencies:
```
npm i react-tggl-client
```

Add the provider to your app:
```tsx
import { TgglClient, TgglProvider } from 'react-tggl-client'

// Instanciate it outside of your component
const client = new TgglClient('YOUR_API_KEY')

const App = () => {
  return (
    <TgglProvider client={client}>
      <h1>Your app</h1>
    </TgglProvider>
  )
}
```

You can optionally pass a context to the provider:
```tsx
const App = () => {
  return (
    <TgglProvider client={client} initialContext={{ /*...*/ }}>
      <h1>Your app</h1>
    </TgglProvider>
  )
}
```
⚠️ Updating the value of `initialContext` will have no effect, keep reading on how to update the context.

You can now change the context anywhere in the app using the `useTggl` hook:
```tsx
import { useTggl } from 'react-tggl-client'

const MyComponent = () => {
  const { setContext } = useTggl()
  
  return (
    <button onClick={() => setContext({ foo: 'bar' })}>
      My button
    </button>
  )
}
```

`setContext` completely overrides the current context, you can use `updateContext`
to partially update some keys:

```tsx
const MyComponent = () => {
  const { updateContext } = useTggl()
  
  return (
    <button onClick={() => updateContext({ foo: 'bar' })}>
      My button
    </button>
  )
}
```

Use the `useFlag` hook to get the state of a flag:
```tsx
const MyComponent = () => {
  const { active } = useFlag('myFlag')
  
  //...
}
```

You may also get the value of a flag:
```tsx
const MyComponent = () => {
  const { value } = useFlag('myFlag')
  
  //...
}
```

If a flag is inactive, deleted, or in-existent, `value` will be `undefined`. You can specify a default value for inactive flags:
```tsx
const MyComponent = () => {
  const { value } = useFlag('myFlag', 42)
  
  //...
}
```
⚠️ If the default value is an object, make sure to memoize it with `useMemo` for performance.

Additionally, you can get the loading and error state of the flag:
```tsx
const MyComponent = () => {
  const { active, value, loading, error } = useFlag('myFlag')
  
  //...
}
```
`loading` is true when the context is being updated. 
While loading, the `error` is always null.

⚠️ You should only read the `value`, `loading`, or `error` if you intend to use them.
This will ensure optimal re-renders.
