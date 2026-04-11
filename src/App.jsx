import React from 'react';
import { UserProvider } from './context/UserContext';
import Home from './pages/Home';

function App() {
  return (
    <UserProvider>
      <Home />
    </UserProvider>
  );
}

export default App;
