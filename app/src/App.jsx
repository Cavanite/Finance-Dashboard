import React from 'react';
import Summary from "../Assets/Components/Summary";
import '../styles.css';

function App() {
    return (
        <div className="App">
        <header className="App-header">
            <h1>Finance Dashboard</h1>
        </header>
        <main>
            <Summary />
        </main>
        </div>
    );
}

export default App;
