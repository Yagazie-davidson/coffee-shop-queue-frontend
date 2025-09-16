import React, { useState } from "react";
import CustomerInterface from "./components/CustomerInterface";
import StaffInterface from "./components/StaffInterface";
import "./App.css";

function App() {
	const [currentView, setCurrentView] = useState<"customer" | "staff">(
		"customer"
	);

	return (
		<div className="App">
			<header className="app-header">
				<h1>☕ Coffee Shop Queue System</h1>
				<nav className="nav-buttons">
					<button
						className={currentView === "customer" ? "active" : ""}
						onClick={() => setCurrentView("customer")}
					>
						Customer View
					</button>
					<button
						className={currentView === "staff" ? "active" : ""}
						onClick={() => setCurrentView("staff")}
					>
						Staff Dashboard
					</button>
				</nav>
			</header>

			<main className="main-content">
				{currentView === "customer" ? (
					<CustomerInterface />
				) : (
					<StaffInterface />
				)}
			</main>

			<footer className="app-footer">
				<p>Built with 🤍 by Letam {new Date().getFullYear()}</p>
			</footer>
		</div>
	);
}

export default App;
