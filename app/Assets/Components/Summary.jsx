import React from "react";
import '../../styles.css';
import { useState, useEffect } from "react";



function Summary() {
    const [data, setData] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/summary');
                const data = await response.json();
                setData(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        fetchData();
    }, []);

    return (
        <div className="summary">
            <h2>Summary</h2>
            {data ? (
                <div>
                    <p>Total Income: {data.totalIncome}</p>
                    <p>Total Expenses: {data.totalExpenses}</p>
                    <p>Total Savings: {data.totalSavings}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default Summary;