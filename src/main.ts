import './app.css'
import App from './App.svelte'

console.log('main.ts executing');

const app = new App({
  target: document.getElementById('app')
})

export default app