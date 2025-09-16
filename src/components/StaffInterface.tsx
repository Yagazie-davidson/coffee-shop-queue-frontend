import React, { useState, useEffect } from "react";
import axios from "axios";

interface Order {
	id: string;
	customer_name: string;
	items: string[];
	priority: string;
	status: string;
	position_in_queue?: number;
	estimated_wait_time: number;
	created_at: string;
}

interface QueueStatus {
	queue_length: number;
	preparing_count: number;
	estimated_wait_time: number;
	queue_orders: Order[];
	preparing_orders: Order[];
}

interface Analytics {
	stats: {
		total_orders: number;
		completed_today: number;
		average_wait_time: number;
		peak_queue_length: number;
	};
	queue_by_priority: {
		VIP: number;
		MOBILE_ORDER: number;
		REGULAR: number;
	};
	recent_completions: Order[];
}

const StaffInterface: React.FC = () => {
	const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchQueueStatus();
		fetchAnalytics();
	}, []);

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

	const fetchAnalytics = async () => {
		try {
			const response = await axios.get(
				"https://coffee-shop-queue-backend.onrender.com/api/analytics"
			);
			console.log(response);
			setAnalytics(response.data);
		} catch (error) {
			console.error("Error fetching analytics:", error);
		}
	};

	const getNextOrder = async () => {
		if (loading) return;

		setLoading(true);
		try {
			const response = await axios.post(
				"https://coffee-shop-queue-backend.onrender.com/api/orders/next"
			);
			if (response.data.success) {
				setCurrentOrder(response.data.order);
			} else {
				alert("No orders in queue");
			}
		} catch (error: any) {
			if (error.response?.status === 204) {
				alert("No orders in queue");
			} else {
				alert(
					"Error getting next order: " +
						(error.response?.data?.error || "Unknown error")
				);
			}
		} finally {
			setLoading(false);
		}
	};

	const completeOrder = async (orderId: string) => {
		if (loading) return;

		setLoading(true);
		try {
			const response = await axios.post(
				`https://coffee-shop-queue-backend.onrender.com/api/orders/${orderId}/complete`
			);
			if (response.data.success) {
				setCurrentOrder(null);
				alert("Order completed successfully!");
				fetchAnalytics();
				fetchQueueStatus();
			}
		} catch (error: any) {
			alert(
				"Error completing order: " +
					(error.response?.data?.error || "Unknown error")
			);
		} finally {
			setLoading(false);
		}
	};

	const cancelOrder = async (orderId: string) => {
		if (loading) return;

		if (!window.confirm("Are you sure you want to cancel this order?")) return;

		setLoading(true);
		try {
			const response = await axios.delete(
				`https://coffee-shop-queue-backend.onrender.com/api/orders/${orderId}/cancel`
			);
			if (response.data.success) {
				if (currentOrder && currentOrder.id === orderId) {
					setCurrentOrder(null);
				}
				alert("Order cancelled successfully!");
				fetchAnalytics();
				fetchQueueStatus();
			}
		} catch (error: any) {
			alert(
				"Error cancelling order: " +
					(error.response?.data?.error || "Unknown error")
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="staff-interface">
			<div className="staff-grid">
				{/* Current Order */}
				<div className="current-order-section">
					<h2>🔥 Current Order</h2>
					{currentOrder ? (
						<div className="current-order">
							<div className="order-details">
								<h3>#{currentOrder.customer_name}</h3>
								<div className="order-items">
									<strong>Items:</strong> {currentOrder.items.join(", ")}
								</div>
								<div className="order-priority">
									<strong>Priority:</strong>
									<span
										className={`priority-badge priority-${currentOrder.priority.toLowerCase()}`}
									>
										{currentOrder.priority}
									</span>
								</div>
								<div className="order-time">
									<strong>Order Time:</strong>{" "}
									{new Date(currentOrder.created_at).toLocaleTimeString()}
								</div>
							</div>
							<div className="order-actions">
								<button
									className="complete-button"
									onClick={() => completeOrder(currentOrder.id)}
									disabled={loading}
								>
									✅ Complete Order
								</button>
								<button
									className="cancel-button"
									onClick={() => cancelOrder(currentOrder.id)}
									disabled={loading}
								>
									❌ Cancel Order
								</button>
							</div>
						</div>
					) : (
						<div className="no-current-order">
							<p>No order currently being prepared</p>
							<button
								className="next-order-button"
								onClick={getNextOrder}
								disabled={loading || !queueStatus?.queue_length}
							>
								{loading ? "Getting Order..." : "Get Next Order"}
							</button>
						</div>
					)}
				</div>

				{/* Analytics Dashboard */}
				<div className="analytics-section">
					<h2>📊 Analytics</h2>
					{analytics && (
						<>
							<div className="analytics-stats">
								<div className="analytics-item">
									<div className="analytics-number">
										{analytics.stats.total_orders}
									</div>
									<div className="analytics-label">Total Orders</div>
								</div>
								<div className="analytics-item">
									<div className="analytics-number">
										{analytics.stats.completed_today}
									</div>
									<div className="analytics-label">Completed Today</div>
								</div>
								<div className="analytics-item">
									<div className="analytics-number">
										{analytics.stats.average_wait_time.toFixed(1)}m
									</div>
									<div className="analytics-label">Avg Wait Time</div>
								</div>
								<div className="analytics-item">
									<div className="analytics-number">
										{analytics.stats.peak_queue_length}
									</div>
									<div className="analytics-label">Peak Queue</div>
								</div>
							</div>

							<h3>Queue by Priority</h3>
							<div className="priority-breakdown">
								<div className="priority-item">
									<span className="priority-badge priority-vip">VIP</span>
									<span className="priority-count">
										{analytics.queue_by_priority.VIP}
									</span>
								</div>
								<div className="priority-item">
									<span className="priority-badge priority-mobile_order">
										Mobile
									</span>
									<span className="priority-count">
										{analytics.queue_by_priority.MOBILE_ORDER}
									</span>
								</div>
								<div className="priority-item">
									<span className="priority-badge priority-regular">
										Regular
									</span>
									<span className="priority-count">
										{analytics.queue_by_priority.REGULAR}
									</span>
								</div>
							</div>

							<h3>Recent Completions</h3>
							<div className="recent-completions">
								{analytics.recent_completions.slice(0, 5).map(order => (
									<div key={order.id} className="completed-order">
										<strong>{order.customer_name}</strong> -{" "}
										{order.items.join(", ")}
									</div>
								))}
							</div>
						</>
					)}
				</div>

				{/* Queue Overview */}
				<div className="queue-overview">
					<h2>📋 Queue Overview</h2>
					{queueStatus && (
						<div className="queue-stats">
							<div className="stat-item">
								<div className="stat-number">{queueStatus.queue_length}</div>
								<div className="stat-label">In Queue</div>
							</div>
							<div className="stat-item">
								<div className="stat-number">{queueStatus.preparing_count}</div>
								<div className="stat-label">Preparing</div>
							</div>
							<div className="stat-item">
								<div className="stat-number">
									{queueStatus.estimated_wait_time}m
								</div>
								<div className="stat-label">Est. Wait</div>
							</div>
						</div>
					)}

					<h3>Next Orders</h3>
					<div className="queue-list">
						{queueStatus?.queue_orders.slice(0, 8).map(order => (
							<div key={order.id} className="queue-item">
								<span className="position">#{order.position_in_queue}</span>
								<div className="order-info">
									<strong>{order.customer_name}</strong>
									<div className="items">{order.items.join(", ")}</div>
								</div>
								<span
									className={`priority priority-${order.priority.toLowerCase()}`}
								>
									{order.priority}
								</span>
								<button
									className="cancel-small"
									onClick={() => cancelOrder(order.id)}
									disabled={loading}
									title="Cancel order"
								>
									❌
								</button>
							</div>
						)) || <p>No orders in queue</p>}
					</div>
				</div>
			</div>
		</div>
	);
};

export default StaffInterface;
