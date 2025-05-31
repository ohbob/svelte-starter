<script lang="ts">
	let { data } = $props();

	// Prepare chart data
	const chartData = data.analytics.dailyViews.map((item) => ({
		date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
		views: item.views,
	}));

	// Get max views for chart scaling
	const maxViews = Math.max(...chartData.map((d) => d.views), 1);
</script>

<div class="p-6">
	<!-- Dashboard Stats -->
	<div class="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-gray-500">Total Services</div>
					<div class="text-2xl font-bold text-gray-900">{data.services?.length || 0}</div>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-gray-500">Active Services</div>
					<div class="text-2xl font-bold text-gray-900">
						{data.services?.filter((s) => s.isActive).length || 0}
					</div>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg
						class="h-8 w-8 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-gray-500">Total Views</div>
					<div class="text-2xl font-bold text-gray-900">{data.analytics.totalViews}</div>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg
						class="h-8 w-8 text-orange-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-gray-500">Views (30 days)</div>
					<div class="text-2xl font-bold text-gray-900">{data.analytics.recentViews}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Analytics and Quick Actions -->
	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Views Chart -->
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white lg:col-span-2">
			<div class="border-b border-gray-200 px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">Daily Views (Last 30 Days)</h2>
			</div>
			<div class="p-6">
				{#if chartData.length > 0}
					<div class="space-y-3">
						{#each chartData as day}
							<div class="flex items-center gap-3">
								<div class="w-16 font-mono text-xs text-gray-500">{day.date}</div>
								<div class="flex flex-1 items-center gap-2">
									<div class="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
										<div
											class="h-full rounded-full bg-blue-500 transition-all duration-300"
											style:width="{(day.views / maxViews) * 100}%"
										></div>
									</div>
									<div class="w-8 text-right text-xs font-medium text-gray-700">{day.views}</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="py-8 text-center">
						<svg
							class="mx-auto mb-4 h-12 w-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<h3 class="mb-2 text-lg font-medium text-gray-900">No views yet</h3>
						<p class="text-sm text-gray-500">Share your portfolio to start getting views!</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<div class="border-b border-gray-200 px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
				<p class="mt-1 text-sm text-gray-500">Manage your portfolio</p>
			</div>
			<div class="space-y-3 p-6">
				<a
					href="/app/services"
					class="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
				>
					<div class="flex items-center gap-3">
						<svg
							class="h-5 w-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						<div>
							<div class="font-medium text-gray-900">Add Service</div>
							<div class="text-sm text-gray-500">Create new offering</div>
						</div>
					</div>
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</a>

				<a
					href="/app/notifications"
					class="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
				>
					<div class="flex items-center gap-3">
						<svg
							class="h-5 w-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							/>
						</svg>
						<div>
							<div class="font-medium text-gray-900">View Notifications</div>
							<div class="text-sm text-gray-500">Manage all notifications</div>
						</div>
					</div>
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</a>

				<a
					href="/app/profile"
					class="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
				>
					<div class="flex items-center gap-3">
						<svg
							class="h-5 w-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						<div>
							<div class="font-medium text-gray-900">Edit Profile</div>
							<div class="text-sm text-gray-500">Update your information</div>
						</div>
					</div>
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</a>

				<a
					href="/app/analytics"
					class="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
				>
					<div class="flex items-center gap-3">
						<svg
							class="h-5 w-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<div>
							<div class="font-medium text-gray-900">View Analytics</div>
							<div class="text-sm text-gray-500">Detailed insights</div>
						</div>
					</div>
					<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</a>
			</div>
		</div>
	</div>
</div>
