import React, { useState, useEffect } from "react";
import axios from "axios";
import io, { Socket } from "socket.io-client";

interface Order {
	id: string;
	customer_name: string;
	items: string[];
	priority: string;
	status: string;
	position_in_queue: number;
	estimated_wait_time: number;
}

interface QueueStatus {
	queue_length: number;
	preparing_count: number;
	estimated_wait_time: number;
	queue_orders: Order[];
}

const CustomerInterface: React.FC = () => {
	const [socket, setSocket] = useState<typeof Socket | null>(null);
	const [customerName, setCustomerName] = useState("");
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [priority, setPriority] = useState("REGULAR");
	const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
	const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(false);

	const menuItems = [
		"Espresso",
		"Americano",
		"Cappuccino",
		"Latte",
		"Mocha",
		"Frappuccino",
		"Croissant",
		"Sandwich",
		"Muffin",
		"Bagel",
	];

	// useEffect(() => {
	// 	// Initialize socket connection
	// 	const newSocket = io("https://coffee-shop-queue-backend.onrender.com");
	// 	setSocket(newSocket);

	// 	newSocket.on("connect", () => {
	// 		console.log("Connected to server");
	// 		newSocket.emit("join_queue_room");
	// 	});

	// 	newSocket.on("queue_updated", (data: QueueStatus) => {
	// 		setQueueStatus(data);
	// 	});

	// 	// Fetch initial queue status
	// 	fetchQueueStatus();

	// 	return () => {
	// 		newSocket.close();
	// 	};
	// }, []);

	useEffect(() => {
		if (customerName) {
			fetchCustomerOrders();
		}
	}, [customerName, queueStatus]); // Refetch when queue updates

	const fetchQueueStatus = async () => {
		try {
			const response = await axios.get(
				"https://coffee-shop-queue-backend.onrender.com/api/queue/status"
			);
			setQueueStatus(response.data);
		} catch (error) {
			console.error("Error fetching queue status:", error);
		}
	};

	const fetchCustomerOrders = async () => {
		if (!customerName) return;
		try {
			const response = await axios.get(
				`https://coffee-shop-queue-backend.onrender.com/api/customer/${customerName}/orders`
			);
			setCustomerOrders(response.data.orders);
		} catch (error) {
			console.error("Error fetching customer orders:", error);
		}
	};

	const handleItemToggle = (item: string) => {
		setSelectedItems(prev =>
			prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
		);
	};

	const submitOrder = async () => {
		if (!customerName || selectedItems.length === 0) {
			alert("Please enter your name and select at least one item.");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post(
				"https://coffee-shop-queue-backend.onrender.com/api/orders",
				{
					customer_name: customerName,
					items: selectedItems,
					priority: priority,
				}
			);

			if (response.data.success) {
				alert(response.data.message);
				fetchCustomerOrders();
				setSelectedItems([]);
			}
		} catch (error: any) {
			alert(
				"Error placing order: " +
					(error.response?.data?.error || "Unknown error")
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="customer-interface">
			<div className="interface-grid">
				{/* Order Form */}
				<div className="order-form">
					<h2>🛒 Place Your Order</h2>

					<div className="form-group">
						<label>Your Name:</label>
						<input
							type="text"
							value={customerName}
							onChange={e => setCustomerName(e.target.value)}
							placeholder="Enter your name"
						/>
					</div>

					<div className="form-group">
						<label>Select Items:</label>
						<div className="items-grid">
							{menuItems.map(item => (
								<button
									key={item}
									className={`item-button ${
										selectedItems.includes(item) ? "selected" : ""
									}`}
									onClick={() => handleItemToggle(item)}
								>
									{item}
								</button>
							))}
						</div>
					</div>

					<div className="form-group">
						<label>Priority:</label>
						<select
							value={priority}
							onChange={e => setPriority(e.target.value)}
						>
							<option value="REGULAR">Regular</option>
							<option value="VIP">VIP</option>
							<option value="MOBILE_ORDER">Mobile Order</option>
						</select>
					</div>

					<button
						className="submit-button"
						onClick={submitOrder}
						disabled={loading || !customerName || selectedItems.length === 0}
					>
						{loading ? "Placing Order..." : "Place Order"}
					</button>
				</div>

				{/* Queue Status */}
				<div className="queue-status">
					<h2>📊 Queue Status</h2>
					{queueStatus && (
						<div className="status-info">
							<div className="status-item">
								<strong>Queue Length:</strong> {queueStatus.queue_length}
							</div>
							<div className="status-item">
								<strong>Orders Being Prepared:</strong>{" "}
								{queueStatus.preparing_count}
							</div>
							<div className="status-item">
								<strong>Estimated Wait Time:</strong>{" "}
								{queueStatus.estimated_wait_time} minutes
							</div>
						</div>
					)}

					<h3>📋 Current Queue</h3>
					<div className="queue-list">
						{queueStatus?.queue_orders.slice(0, 5).map((order, index) => (
							<div key={order.id} className="queue-item">
								<span className="position">#{order.position_in_queue}</span>
								<span className="name">{order.customer_name}</span>
								<span className="items">{order.items.join(", ")}</span>
								<span
									className={`priority priority-${order.priority.toLowerCase()}`}
								>
									{order.priority}
								</span>
							</div>
						)) || <p>No orders in queue</p>}
						{queueStatus && queueStatus.queue_length > 5 && (
							<p className="more-orders">
								...and {queueStatus.queue_length - 5} more orders
							</p>
						)}
					</div>
				</div>

				{/* Customer Orders */}
				{customerName && (
					<div className="customer-orders">
						<h2>📝 Your Orders</h2>
						{customerOrders.length > 0 ? (
							<div className="orders-list">
								{customerOrders.map(order => (
									<div key={order.id} className="customer-order">
										<div className="order-info">
											<strong>Items:</strong> {order.items.join(", ")}
											<br />
											<strong>Status:</strong>{" "}
											<span className={`status-${order.status}`}>
												{order.status}
											</span>
											<br />
											{order.position_in_queue && (
												<>
													<strong>Position:</strong> #{order.position_in_queue}
													<br />
													<strong>Est. Wait:</strong>{" "}
													{order.estimated_wait_time} minutes
												</>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<p>No orders found for {customerName}</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default CustomerInterface;
