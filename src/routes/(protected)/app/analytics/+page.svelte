<script lang="ts">
	let { data } = $props();

	// Tab state
	let activeTab = $state("overview");

	// Prepare chart data
	const chartData = data.analytics.dailyViews.map((item) => ({
		date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
		fullDate: item.date,
		views: item.views,
	}));

	// Get max views for chart scaling
	const maxViews = Math.max(...chartData.map((d) => d.views), 1);

	// Calculate growth
	const currentPeriodViews = data.analytics.recentViews;
	const previousPeriodViews = data.analytics.previousPeriodViews || 0;
	const growth =
		previousPeriodViews > 0
			? (((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 100).toFixed(1)
			: currentPeriodViews > 0
				? "100"
				: "0";
	const isGrowthPositive = parseFloat(growth) >= 0;
</script>

<div class="p-6">
	<!-- Tab Navigation -->
	<div class="mb-6 border-b border-gray-200">
		<nav class="-mb-px flex space-x-8">
			<button
				onclick={() => (activeTab = "overview")}
				class="whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors {activeTab ===
				'overview'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			>
				Overview
			</button>
			<button
				onclick={() => (activeTab = "referrers")}
				class="whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors {activeTab ===
				'referrers'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			>
				Referrers
				{#if data.analytics.topReferrers.length > 0}
					<span class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
						{data.analytics.topReferrers.length}
					</span>
				{/if}
			</button>
		</nav>
	</div>

	{#if activeTab === "overview"}
		<!-- Overview Tab Content -->
		<!-- Analytics Stats -->
		<div class="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm font-medium text-gray-500">Total Views</div>
						<div class="text-2xl font-bold text-gray-900">{data.analytics.totalViews}</div>
					</div>
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
						<svg
							class="h-5 w-5 text-blue-600"
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
				</div>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm font-medium text-gray-500">Views (30 days)</div>
						<div class="text-2xl font-bold text-gray-900">{data.analytics.recentViews}</div>
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
						<svg
							class="h-5 w-5 text-green-600"
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
				</div>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm font-medium text-gray-500">Avg. Daily Views</div>
						<div class="text-2xl font-bold text-gray-900">
							{chartData.length > 0 ? Math.round(data.analytics.recentViews / 30) : 0}
						</div>
						{#if chartData.length === 0 && data.analytics.totalViews > 0}
							<div class="mt-1 text-xs text-gray-400">Will show after multiple days</div>
						{/if}
					</div>
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
						<svg
							class="h-5 w-5 text-purple-600"
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
					</div>
				</div>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm font-medium text-gray-500">Unique Referrers</div>
						<div class="text-2xl font-bold text-gray-900">{data.analytics.topReferrers.length}</div>
					</div>
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
						<svg
							class="h-5 w-5 text-orange-600"
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
				</div>
			</div>
		</div>

		<!-- Charts and Quick Actions -->
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
										<div class="relative h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
											<div
												class="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
												style:width="{(day.views / maxViews) * 100}%"
											></div>
										</div>
										<div class="w-8 text-right text-xs font-medium text-gray-700">{day.views}</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-12 text-center">
							<svg
								class="mx-auto mb-4 h-16 w-16 text-gray-400"
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
							{#if data.user?.customUrl}
								<a
									href="/u/{data.user.customUrl}"
									target="_blank"
									class="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
								>
									View My Portfolio
									<svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</a>
							{/if}
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
					{#if data.user?.customUrl}
						<a
							href="/u/{data.user.customUrl}"
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
							<svg
								class="h-4 w-4 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
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
						href="/app/services"
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
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
							<span class="text-sm font-medium text-gray-900">Manage Services</span>
						</div>
						<svg
							class="h-4 w-4 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
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
						<svg
							class="h-4 w-4 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
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
	{:else if activeTab === "referrers"}
		<!-- Referrers Tab Content -->
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<div class="border-b border-gray-200 px-6 py-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Traffic Sources</h2>
					<div class="text-sm text-gray-500">Last 30 days</div>
				</div>
			</div>
			<div class="p-6">
				{#if data.analytics.topReferrers.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="border-b border-gray-200">
								<tr>
									<th class="px-4 py-3 text-left font-medium text-gray-900">Source</th>
									<th class="px-4 py-3 text-left font-medium text-gray-900">Domain</th>
									<th class="px-4 py-3 text-left font-medium text-gray-900">Path</th>
									<th class="px-4 py-3 text-right font-medium text-gray-900">Views</th>
									<th class="px-4 py-3 text-right font-medium text-gray-900">Percentage</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								{#each data.analytics.topReferrers as referrer, index}
									<tr class="hover:bg-gray-50">
										<td class="px-4 py-4">
											<div class="flex items-center gap-3">
												<div
													class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600"
												>
													{index + 1}
												</div>
												<div class="flex items-center gap-2">
													<div class="flex h-4 w-4 items-center justify-center rounded bg-blue-100">
														<svg
															class="h-2.5 w-2.5 text-blue-600"
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<path
																fill-rule="evenodd"
																d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z"
																clip-rule="evenodd"
															/>
															<path
																fill-rule="evenodd"
																d="M7.414 15.414a2 2 0 01-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 00-1.414-1.414l-1.5 1.5z"
																clip-rule="evenodd"
															/>
														</svg>
													</div>
													<span class="text-sm font-medium text-gray-900">{referrer.referrer}</span>
												</div>
											</div>
										</td>
										<td class="px-4 py-4">
											<span class="text-sm text-gray-600">{referrer.domain}</span>
										</td>
										<td class="px-4 py-4">
											<span class="font-mono text-sm text-gray-500">{referrer.path || "/"}</span>
										</td>
										<td class="px-4 py-4 text-right">
											<span class="text-sm font-medium text-gray-900">{referrer.views}</span>
										</td>
										<td class="px-4 py-4 text-right">
											<div class="flex items-center justify-end gap-2">
												<div class="h-2 w-16 rounded-full bg-gray-200">
													<div
														class="h-2 rounded-full bg-blue-500"
														style:width="{(referrer.views / data.analytics.recentViews) * 100}%"
													></div>
												</div>
												<span class="w-10 text-right text-sm text-gray-500">
													{Math.round((referrer.views / data.analytics.recentViews) * 100)}%
												</span>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="py-12 text-center">
						<svg
							class="mx-auto mb-4 h-16 w-16 text-gray-400"
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
							Traffic sources will appear here when people visit your portfolio from other sites.
						</p>
						{#if data.user?.customUrl}
							<a
								href="/u/{data.user.customUrl}"
								target="_blank"
								class="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
							>
								Share Your Portfolio
								<svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
