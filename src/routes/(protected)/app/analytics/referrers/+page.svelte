<script lang="ts">
	let { data } = $props();
</script>

<!-- Referrers Content -->
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
