<script lang="ts">
	import { enhance } from "$app/forms";
	import { toast } from "$lib/utils/toast";
	import AnalyticsHistogram from "$lib/components/AnalyticsHistogram.svelte";

	let { data, form } = $props();

	// Use derived values instead of state + effect to prevent infinite loops
	const analyticsData = $derived(
		data?.analytics || {
			totalViews: 0,
			recentViews: 0,
			previousPeriodViews: 0,
			todayViews: 0,
			dailyViews: [],
			topReferrers: [],
		}
	);

	const userData = $derived(data?.user);

	const growth = $derived(
		(() => {
			const currentPeriodViews = analyticsData.recentViews;
			const previousPeriodViews = analyticsData.previousPeriodViews || 0;
			return previousPeriodViews > 0
				? (((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 100).toFixed(1)
				: currentPeriodViews > 0
					? "100"
					: "0";
		})()
	);

	const isGrowthPositive = $derived(parseFloat(growth) >= 0);

	// Cleanup form state
	let cleanupLoading = $state(false);
	let retentionDays = $state(120);

	// Handle cleanup form
	const handleCleanupEnhance = () => {
		cleanupLoading = true;
		return async ({ result, update }) => {
			if (result.type === "success") {
				toast.success(result.data?.message || "Analytics cleanup completed successfully!");
			} else if (result.type === "failure") {
				toast.error(result.data?.error || "Failed to cleanup analytics");
			}
			await update();
			cleanupLoading = false;
		};
	};

	// Handle form results
	$effect(() => {
		if (form?.success) {
			toast.success(form.message || "Analytics cleanup completed successfully!");
		} else if (form?.error) {
			toast.error(form.error);
		}
	});
</script>

<!-- Analytics Stats -->
<div class="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
	<div class="rounded-lg border border-gray-200 bg-white p-6">
		<div class="flex items-center justify-between">
			<div>
				<div class="text-sm font-medium text-gray-500">Total Views</div>
				<div class="text-2xl font-bold text-gray-900">{analyticsData.totalViews}</div>
			</div>
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
				<svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
		</div>
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-6">
		<div class="flex items-center justify-between">
			<div>
				<div class="text-sm font-medium text-gray-500">Views (30 days)</div>
				<div class="text-2xl font-bold text-gray-900">{analyticsData.recentViews}</div>
				<div class="mt-1 flex items-center">
					{#if isGrowthPositive}
						<svg class="mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-xs text-green-600">+{growth}%</span>
					{:else}
						<svg class="mr-1 h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-xs text-red-600">{growth}%</span>
					{/if}
				</div>
			</div>
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
				<svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
					/>
				</svg>
			</div>
		</div>
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-6">
		<div class="flex items-center justify-between">
			<div>
				<div class="text-sm font-medium text-gray-500">Avg. Daily Views</div>
				<div class="text-2xl font-bold text-gray-900">
					{analyticsData.dailyViews.length > 0 ? Math.round(analyticsData.recentViews / 30) : 0}
				</div>
				{#if analyticsData.dailyViews.length === 0 && analyticsData.totalViews > 0}
					<div class="mt-1 text-xs text-gray-400">Will show after multiple days</div>
				{/if}
			</div>
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
				<svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
		</div>
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-6">
		<div class="flex items-center justify-between">
			<div>
				<div class="text-sm font-medium text-gray-500">Unique Referrers</div>
				<div class="text-2xl font-bold text-gray-900">{analyticsData.topReferrers.length}</div>
			</div>
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
				<svg class="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
					/>
				</svg>
			</div>
		</div>
	</div>
</div>

<!-- Analytics Histogram -->
<div class="mb-6">
	<AnalyticsHistogram
		dailyViews={analyticsData.dailyViews}
		topReferrers={analyticsData.topReferrers}
	/>
</div>

<!-- Charts and Quick Actions -->
<div class="grid gap-6 lg:grid-cols-3">
	<!-- Top Referrers -->
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white lg:col-span-2">
		<div class="border-b border-gray-200 px-6 py-4">
			<h2 class="text-lg font-semibold text-gray-900">Top Referrers</h2>
		</div>
		<div class="p-6">
			{#if analyticsData.topReferrers.length > 0}
				<div class="space-y-3">
					{#each analyticsData.topReferrers as referrer}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
									<svg
										class="h-4 w-4 text-gray-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
										/>
									</svg>
								</div>
								<div>
									<div class="font-medium text-gray-900">{referrer.source}</div>
									<div class="text-sm text-gray-500">{referrer.views} views</div>
								</div>
							</div>
							<div class="text-sm font-medium text-gray-700">{referrer.percentage}%</div>
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
							d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
						/>
					</svg>
					<h3 class="mb-2 text-lg font-medium text-gray-900">No referrers yet</h3>
					<p class="text-sm text-gray-500">
						When people visit from other sites, they'll appear here.
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
		<div class="border-b border-gray-200 px-6 py-4">
			<h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
		</div>
		<div class="space-y-3 p-6">
			{#if userData?.customUrl}
				<a
					href="/u/{userData.customUrl}"
					target="_blank"
					class="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300"
				>
					<div class="flex items-center gap-3">
						<svg
							class="h-4 w-4 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
						<span class="text-sm font-medium text-gray-900">View Portfolio</span>
					</div>
					<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</a>
			{/if}

			<a
				href="/app/company/services"
				class="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300"
			>
				<div class="flex items-center gap-3">
					<svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<span class="text-sm font-medium text-gray-900">Manage Services</span>
				</div>
				<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a
				href="/app/profile"
				class="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300"
			>
				<div class="flex items-center gap-3">
					<svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					<span class="text-sm font-medium text-gray-900">Profile Settings</span>
				</div>
				<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</div>
</div>

<!-- Analytics Cleanup Section -->
<div class="mt-8 rounded-lg border border-gray-200 bg-white">
	<div class="border-b border-gray-200 px-6 py-4">
		<h2 class="text-lg font-semibold text-gray-900">Analytics Cleanup</h2>
		<p class="mt-1 text-sm text-gray-600">
			Remove old analytics data to keep your database clean and improve performance.
		</p>
	</div>
	<div class="p-6">
		<form method="POST" action="?/cleanup" use:enhance={handleCleanupEnhance} class="space-y-4">
			<div>
				<label for="retentionDays" class="block text-sm font-medium text-gray-700">
					Retention Period (days)
				</label>
				<div class="mt-1">
					<input
						type="number"
						id="retentionDays"
						name="retentionDays"
						bind:value={retentionDays}
						min="30"
						max="365"
						class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
					/>
				</div>
				<p class="mt-1 text-sm text-gray-500">
					Analytics data older than this will be permanently deleted.
				</p>
			</div>

			<div class="flex items-center justify-between">
				<div class="text-sm text-gray-600">This action cannot be undone. Please be careful.</div>
				<button
					type="submit"
					disabled={cleanupLoading}
					class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{cleanupLoading ? "Cleaning..." : "Cleanup Analytics"}
				</button>
			</div>
		</form>
	</div>
</div>
