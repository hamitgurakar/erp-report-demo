import Dashboard from './pages/Dashboard'
// SADECE dev: geçici login. Prod build'de import.meta.env.DEV=false → aşağıdaki
// dal ölü kod olur, import tree-shake ile atılır (bundle'a hiç girmez).
import { DevAuthGate } from './auth/DevAuthGate'

function App() {
  return (
    <>
      <Dashboard />
      {import.meta.env.DEV && <DevAuthGate />}
    </>
  )
}

export default App
