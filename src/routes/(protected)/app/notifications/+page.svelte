<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { Button } from "$lib/components/ui/button";

	let { data, form } = $props();

	let notifications = $state([]);
	let unreadCount = $state(0);
	let showUnreadOnly = $state(false);
	let loading = $state(false);

	// Sync data from server
	$effect(() => {
		notifications = data.notifications || [];
		unreadCount = data.unreadCount || 0;
	});

	// Handle form results
	$effect(() => {
		if (form?.success) {
			// Reload the page to get fresh data
			goto($page.url, { invalidateAll: true });
		}
	});

	// Toggle filter
	function toggleFilter() {
		showUnreadOnly = !showUnreadOnly;
		const url = new URL($page.url);
		if (showUnreadOnly) {
			url.searchParams.set("unreadOnly", "true");
		} else {
			url.searchParams.delete("unreadOnly");
		}
		url.searchParams.delete("page"); // Reset to page 1
		goto(url);
	}

	// Load more notifications
	function loadMore() {
		const url = new URL($page.url);
		const currentPage = parseInt(url.searchParams.get("page") || "1");
		url.searchParams.set("page", (currentPage + 1).toString());
		goto(url);
	}

	// Format time
	function formatTime(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

		return date.toLocaleDateString();
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
				return "text-green-600 bg-green-50";
			case "error":
				return "text-red-600 bg-red-50";
			case "warning":
				return "text-yellow-600 bg-yellow-50";
			default:
				return "text-blue-600 bg-blue-50";
		}
	}

	// Handle mark as read
	function handleMarkAsRead() {
		loading = true;
		return async ({ update }) => {
			await update();
			loading = false;
		};
	}

	// Handle delete
	function handleDelete() {
		loading = true;
		return async ({ update }) => {
			await update();
			loading = false;
		};
	}

	// Handle mark all as read
	function handleMarkAllAsRead() {
		loading = true;
		return async ({ update }) => {
			await update();
			loading = false;
		};
	}
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
					<form method="POST" action="?/markAllAsRead" use:enhance={handleMarkAllAsRead}>
						<Button type="submit" variant="outline" size="sm" disabled={loading}>
							Mark All Read
						</Button>
					</form>
				{/if}
			</div>
		</div>
	</div>

	<!-- Notifications List -->
	<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
		{#if notifications.length === 0}
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
											<form method="POST" action="?/markAsRead" use:enhance={handleMarkAsRead}>
												<input type="hidden" name="notificationId" value={notification.id} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													disabled={loading}
													class="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
												>
													Mark as read
												</Button>
											</form>
										{/if}
										<form method="POST" action="?/delete" use:enhance={handleDelete}>
											<input type="hidden" name="notificationId" value={notification.id} />
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												disabled={loading}
												class="text-red-600 hover:bg-red-50 hover:text-red-800"
											>
												Delete
											</Button>
										</form>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Load More -->
			{#if data.hasMore}
				<div class="border-t border-gray-200 p-6 text-center">
					<Button variant="outline" onclick={loadMore} class="w-full sm:w-auto">Load More</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>
