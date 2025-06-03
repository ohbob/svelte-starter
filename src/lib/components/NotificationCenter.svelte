<script>
	import { Button } from "$lib/components/ui/button";

	let {
		class: className = "",
		notifications = [],
		unreadCount = 0,
		onMarkAsRead = () => {},
		onMarkAllAsRead = () => {},
		onDelete = () => {},
	} = $props();

	let isOpen = $state(false);

	// Format time
	function formatTime(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	}

	// Get icon for notification type
	function getTypeIcon(type) {
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
	}

	// Get color for notification type
	function getTypeColor(type) {
		switch (type) {
			case "success":
				return "text-green-600";
			case "error":
				return "text-red-600";
			case "warning":
				return "text-yellow-600";
			default:
				return "text-blue-600";
		}
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		const target = event.target;
		if (!target.closest("[data-notification-center]")) {
			isOpen = false;
		}
	}

	// Handle toggle
	function handleToggle() {
		isOpen = !isOpen;
	}

	// Handle view all
	function handleViewAll() {
		isOpen = false;
		window.location.href = "/app/notifications";
	}

	function handleMarkAsRead(notificationId) {
		return () => onMarkAsRead(notificationId);
	}

	function handleDelete(notificationId) {
		return () => onDelete(notificationId);
	}

	$effect(() => {
		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	});
</script>

<div class="relative {className}" data-notification-center>
	<!-- Bell Icon Button -->
	<Button variant="ghost" size="sm" onclick={handleToggle} class="relative">
		<!-- Bell Icon -->
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
			/>
		</svg>

		<!-- Unread Count Badge -->
		{#if unreadCount > 0}
			<span
				class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
			>
				{unreadCount > 99 ? "99+" : unreadCount}
			</span>
		{/if}
	</Button>

	<!-- Dropdown -->
	{#if isOpen}
		<div
			class="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 p-4">
				<h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
				{#if unreadCount > 0}
					<Button
						variant="ghost"
						size="sm"
						onclick={onMarkAllAsRead}
						class="text-sm text-blue-600 hover:text-blue-800"
					>
						Mark all read
					</Button>
				{/if}
			</div>

			<!-- Notifications List -->
			<div class="max-h-96 overflow-y-auto">
				{#if notifications.length === 0}
					<div class="p-8 text-center text-gray-500">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-2xl text-gray-400"
						>
							🔔
						</div>
						<p class="text-sm">No notifications yet</p>
					</div>
				{:else}
					{#each notifications as notification}
						<div
							class="border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 {!notification.isRead
								? 'bg-blue-50'
								: ''}"
						>
							<div class="flex items-start gap-3">
								<!-- Type Icon -->
								<div class="mt-0.5 flex-shrink-0">
									<div
										class="h-5 w-5 {getTypeColor(
											notification.type
										)} flex items-center justify-center font-bold"
									>
										{getTypeIcon(notification.type)}
									</div>
								</div>

								<!-- Content -->
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<p
												class="text-sm font-medium text-gray-900 {!notification.isRead
													? 'font-semibold'
													: ''}"
											>
												{notification.title}
											</p>
											{#if notification.message}
												<p class="mt-1 text-sm text-gray-600">
													{notification.message}
												</p>
											{/if}
											<p class="mt-2 text-xs text-gray-500">
												{formatTime(notification.createdAt)}
											</p>
										</div>

										<!-- Actions -->
										<div class="ml-2 flex items-center gap-1">
											{#if !notification.isRead}
												<Button
													variant="ghost"
													size="sm"
													onclick={handleMarkAsRead(notification.id)}
													class="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
													title="Mark as read"
												>
													✓
												</Button>
											{/if}
											<Button
												variant="ghost"
												size="sm"
												onclick={handleDelete(notification.id)}
												class="h-6 w-6 p-0 text-red-600 hover:text-red-800"
												title="Delete"
											>
												✗
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			{#if notifications.length > 0}
				<div class="border-t border-gray-200 p-3 text-center">
					<Button
						variant="ghost"
						size="sm"
						onclick={handleViewAll}
						class="text-sm text-gray-600 hover:text-gray-800"
					>
						View all notifications
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
