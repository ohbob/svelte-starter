<script>
	import { Button } from "$lib/components/ui/button";
	import { onMount } from "svelte";

	let notifications = $state([]);
	let loading = $state(false);
	let unreadCount = $state(0);
	let currentPage = $state(1);
	let hasMore = $state(true);
	let showUnreadOnly = $state(false);

	const ITEMS_PER_PAGE = 20;

	// Fetch notifications
	const fetchNotifications = async (page = 1, reset = false) => {
		loading = true;
		try {
			const offset = (page - 1) * ITEMS_PER_PAGE;
			const params = new URLSearchParams({
				limit: ITEMS_PER_PAGE.toString(),
				offset: offset.toString(),
				unreadOnly: showUnreadOnly.toString(),
			});

			const response = await fetch(`/api/notifications?${params}`);
			if (response.ok) {
				const data = await response.json();

				if (reset || page === 1) {
					notifications = data.notifications;
				} else {
					notifications = [...notifications, ...data.notifications];
				}

				unreadCount = data.unreadCount;
				hasMore = data.hasMore;
				currentPage = page;
			}
		} catch (error) {
			console.error("Error fetching notifications:", error);
		} finally {
			loading = false;
		}
	};

	// Mark notification as read
	const markAsRead = async (notificationId) => {
		try {
			const response = await fetch(`/api/notifications/${notificationId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isRead: true }),
			});

			if (response.ok) {
				notifications = notifications.map((n) =>
					n.id === notificationId ? { ...n, isRead: true } : n
				);
				unreadCount = Math.max(0, unreadCount - 1);
			}
		} catch (error) {
			console.error("Error marking notification as read:", error);
		}
	};

	// Mark all as read
	const markAllAsRead = async () => {
		try {
			const response = await fetch("/api/notifications/mark-all-read", {
				method: "POST",
			});

			if (response.ok) {
				notifications = notifications.map((n) => ({ ...n, isRead: true }));
				unreadCount = 0;
			}
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
		}
	};

	// Delete notification
	const deleteNotification = async (notificationId) => {
		try {
			const response = await fetch(`/api/notifications/${notificationId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				const notification = notifications.find((n) => n.id === notificationId);
				notifications = notifications.filter((n) => n.id !== notificationId);
				if (notification && !notification.isRead) {
					unreadCount = Math.max(0, unreadCount - 1);
				}
			}
		} catch (error) {
			console.error("Error deleting notification:", error);
		}
	};

	// Load more notifications
	const loadMore = () => {
		if (!loading && hasMore) {
			fetchNotifications(currentPage + 1, false);
		}
	};

	// Toggle filter
	const toggleFilter = () => {
		showUnreadOnly = !showUnreadOnly;
		fetchNotifications(1, true);
	};

	// Format time
	const formatTime = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

		return date.toLocaleDateString();
	};

	// Get icon for notification type
	const getTypeIcon = (type) => {
		switch (type) {
			case "success":
				return "✓";
			case "error":
				return "✗";
			case "warning":
				return "⚠";
			default:
				return "ℹ";
		}
	};

	// Get color for notification type
	const getTypeColor = (type) => {
		switch (type) {
			case "success":
				return "text-green-600 bg-green-50";
			case "error":
				return "text-red-600 bg-red-50";
			case "warning":
				return "text-yellow-600 bg-yellow-50";
			default:
				return "text-blue-600 bg-blue-50";
		}
	};

	// Handle mark as read
	const handleMarkAsRead = (notificationId) => {
		return () => markAsRead(notificationId);
	};

	// Handle delete notification
	const handleDeleteNotification = (notificationId) => {
		return () => deleteNotification(notificationId);
	};

	onMount(() => {
		fetchNotifications();
	});
</script>

<svelte:head>
	<title>Notifications - Admin Panel</title>
</svelte:head>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Notifications</h1>
				<p class="mt-1 text-gray-600">
					{unreadCount > 0
						? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
						: "All caught up!"}
				</p>
			</div>
			<div class="flex items-center gap-3">
				<Button variant={showUnreadOnly ? "default" : "outline"} size="sm" onclick={toggleFilter}>
					{showUnreadOnly ? "Show All" : "Unread Only"}
				</Button>
				{#if unreadCount > 0}
					<Button variant="outline" size="sm" onclick={markAllAsRead}>Mark All Read</Button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Notifications List -->
	<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
		{#if loading && notifications.length === 0}
			<div class="p-8 text-center text-gray-500">
				<div class="mx-auto mb-4 h-8 w-8 animate-spin">⟳</div>
				<p>Loading notifications...</p>
			</div>
		{:else if notifications.length === 0}
			<div class="p-12 text-center text-gray-500">
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center text-4xl text-gray-400">
					🔔
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">
					{showUnreadOnly ? "No unread notifications" : "No notifications yet"}
				</h3>
				<p class="text-sm">
					{showUnreadOnly
						? "You're all caught up! Check back later for new updates."
						: "When you receive notifications, they'll appear here."}
				</p>
			</div>
		{:else}
			<div class="divide-y divide-gray-200">
				{#each notifications as notification}
					<div
						class="p-6 transition-colors hover:bg-gray-50 {!notification.isRead
							? 'bg-blue-50/50'
							: ''}"
					>
						<div class="flex items-start gap-4">
							<!-- Type Icon -->
							<div class="mt-1 flex-shrink-0">
								<div
									class="h-8 w-8 rounded-full {getTypeColor(
										notification.type
									)} flex items-center justify-center text-sm font-bold"
								>
									{getTypeIcon(notification.type)}
								</div>
							</div>

							<!-- Content -->
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h3
											class="text-base font-medium text-gray-900 {!notification.isRead
												? 'font-semibold'
												: ''}"
										>
											{notification.title}
											{#if !notification.isRead}
												<span class="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
											{/if}
										</h3>
										{#if notification.message}
											<p class="mt-1 text-sm leading-relaxed text-gray-600">
												{notification.message}
											</p>
										{/if}
										<div class="mt-3 flex items-center gap-4">
											<p class="text-xs text-gray-500">
												{formatTime(notification.createdAt)}
											</p>
											<span class="text-xs capitalize text-gray-400">
												{notification.type}
											</span>
										</div>
									</div>

									<!-- Actions -->
									<div class="ml-4 flex items-center gap-2">
										{#if !notification.isRead}
											<Button
												variant="ghost"
												size="sm"
												onclick={handleMarkAsRead(notification.id)}
												class="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
											>
												Mark as read
											</Button>
										{/if}
										<Button
											variant="ghost"
											size="sm"
											onclick={handleDeleteNotification(notification.id)}
											class="text-red-600 hover:bg-red-50 hover:text-red-800"
										>
											Delete
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Load More -->
			{#if hasMore}
				<div class="border-t border-gray-200 p-6 text-center">
					<Button variant="outline" onclick={loadMore} disabled={loading} class="w-full sm:w-auto">
						{loading ? "Loading..." : "Load More"}
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>
