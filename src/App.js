import './App.css';
import React from 'react';
import Tabs from './components/Tabs';
import { LoginUserProvider } from './components/LoginUser';
import { TabProvider } from './components/TabContext';

function App() {
  return (
    <div className="App">
      <LoginUserProvider>
        <TabProvider>
          <Tabs/>
        </TabProvider>
      </LoginUserProvider>
    </div>
  );
}

export default App;