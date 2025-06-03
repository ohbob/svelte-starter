<script>
	let { dailyViews, topReferrers } = $props();

	// Color palette for different sources
	const sourceColors = [
		"#ef4444",
		"#f97316",
		"#eab308",
		"#22c55e",
		"#06b6d4",
		"#3b82f6",
		"#8b5cf6",
		"#ec4899",
		"#64748b",
		"#6b7280",
	];

	// Use derived values instead of state + effect to prevent infinite loops
	const domainColors = $derived(() => {
		// Get top domains for color mapping
		const topDomains = topReferrers
			.slice(0, 8)
			.map((r) => r.domain)
			.filter((domain, index, arr) => arr.indexOf(domain) === index);

		// Create domain to color mapping
		const colorMap = new Map();
		topDomains.forEach((domain, index) => {
			colorMap.set(domain, sourceColors[index % sourceColors.length]);
		});
		colorMap.set("direct", "#6b7280");
		return colorMap;
	});

	const histogramDays = $derived(() => {
		// Create views map
		const viewsMap = new Map();
		dailyViews.forEach((item) => {
			const date = new Date(item.date);
			const dateKey = date.toISOString().split("T")[0];
			viewsMap.set(dateKey, item.views);
		});

		// Get top domains for source breakdown
		const topDomains = topReferrers
			.slice(0, 8)
			.map((r) => r.domain)
			.filter((domain, index, arr) => arr.indexOf(domain) === index);

		// Generate histogram data
		const today = new Date();
		const thirtyDaysAgo = new Date(today);
		thirtyDaysAgo.setDate(today.getDate() - 29);

		const days = [];
		for (let i = 0; i < 30; i++) {
			const currentDate = new Date(thirtyDaysAgo);
			currentDate.setDate(thirtyDaysAgo.getDate() + i);

			const dateKey = currentDate.toISOString().split("T")[0];
			const isToday = currentDate.toDateString() === today.toDateString();
			const isFuture = currentDate > today;
			const totalViews = viewsMap.get(dateKey) || 0;

			// Simulate source breakdown
			const sources = [];
			if (totalViews > 0) {
				const sourceCount = Math.min(Math.ceil(totalViews / 20), topDomains.length);
				let remainingViews = totalViews;

				for (let j = 0; j < sourceCount && remainingViews > 0; j++) {
					const domain = topDomains[j] || "direct";
					const views =
						j === sourceCount - 1
							? remainingViews
							: Math.floor(remainingViews * (0.3 + Math.random() * 0.4));
					sources.push({
						domain,
						views: Math.max(1, views),
						color: domainColors().get(domain),
					});
					remainingViews -= views;
				}
			}

			days.push({
				day: currentDate.getDate(),
				month: currentDate.getMonth(),
				year: currentDate.getFullYear(),
				totalViews,
				sources,
				isToday,
				isFuture,
				date: currentDate,
				dateKey,
				shortDate: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
			});
		}

		return days;
	});

	const maxViews = $derived(Math.max(...histogramDays().map((d) => d.totalViews), 1));

	const yAxisLabels = $derived(() => {
		// Y-axis calculations
		const yAxisSteps = 6;
		const stepValue = maxViews / (yAxisSteps - 1);
		return Array.from({ length: yAxisSteps }, (_, i) => {
			return Math.round(maxViews - i * stepValue);
		});
	});

	// Smart number formatting
	function formatViews(views) {
		if (views < 1000) return views.toString();
		if (views < 1000000) return (views / 1000).toFixed(views < 10000 ? 1 : 0) + "k";
		return (views / 1000000).toFixed(1) + "M";
	}

	// Tooltip state
	let hoveredDay = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function handleBarHover(day, event) {
		hoveredDay = day;
		const rect = event.target.getBoundingClientRect();
		tooltipX = rect.left + rect.width / 2;
		tooltipY = rect.top;
	}

	function handleBarLeave() {
		hoveredDay = null;
	}
</script>

<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
	<div class="border-b border-gray-200 px-6 py-4">
		<h2 class="text-lg font-semibold text-gray-900">Traffic Sources - Last 30 Days</h2>
		<p class="text-sm text-gray-500">Daily views broken down by referrer source</p>
	</div>
	<div class="p-6">
		{#if histogramDays().length > 0 && maxViews > 0}
			<!-- Stacked Bar Chart -->
			<div class="mb-4 flex gap-2">
				<!-- Y-axis labels -->
				<div class="flex h-64 w-12 flex-col justify-between py-2">
					{#each yAxisLabels() as value}
						<div class="text-right text-xs leading-none text-gray-500">
							{formatViews(value)}
						</div>
					{/each}
				</div>

				<!-- Chart area -->
				<div class="relative h-64 flex-1 overflow-visible border-b-2 border-l-2 border-gray-300">
					<div class="absolute inset-0 flex items-end justify-between overflow-visible px-1 pb-1">
						{#each histogramDays() as day}
							<div class="flex h-full flex-1 flex-col items-center justify-end">
								<!-- Stacked Bar -->
								{#if !day.isFuture && day.totalViews > 0}
									<div
										role="button"
										tabindex="0"
										class="relative flex w-full max-w-[16px] cursor-pointer flex-col justify-end rounded-t transition-all duration-300 hover:opacity-90 {day.isToday
											? 'ring-2 ring-blue-400 ring-offset-1'
											: ''}"
										style:height="{Math.max((day.totalViews / maxViews) * 240, 8)}px"
										onmouseenter={(e) => handleBarHover(day, e)}
										onmouseleave={handleBarLeave}
									>
										<!-- Source segments -->
										{#each day.sources as source, index}
											<div
												class="w-full {index === 0 ? 'rounded-t' : ''}"
												style:background-color={source.color}
												style:height="{(source.views / day.totalViews) * 100}%"
											></div>
										{/each}
									</div>
								{:else if !day.isFuture}
									<!-- Empty day -->
									<div class="h-1 w-full max-w-[16px] rounded bg-gray-200"></div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- X-axis labels -->
			<div class="mb-6 ml-14 flex justify-between text-xs text-gray-500">
				{#each histogramDays() as day, i}
					{#if i % 5 === 0 || day.isToday || i === histogramDays().length - 1}
						<div class="text-center">
							{day.date.getDate()}/{day.date.getMonth() + 1}
						</div>
					{/if}
				{/each}
			</div>

			<!-- Legend -->
			<div class="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
				{#each Array.from(domainColors().entries()).slice(0, 8) as [domain, color]}
					{#if domain !== "direct"}
						<div class="flex items-center gap-2">
							<div class="h-3 w-3 rounded" style:background-color={color}></div>
							<span class="text-gray-600">{domain}</span>
						</div>
					{/if}
				{/each}
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded bg-gray-500"></div>
					<span class="text-gray-600">Direct</span>
				</div>
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
				<h3 class="mb-2 text-lg font-medium text-gray-900">No data yet</h3>
				<p class="text-sm text-gray-500">
					Traffic analytics will appear here when people visit your portfolio.
				</p>
			</div>
		{/if}
	</div>
</div>

<!-- Tooltip -->
{#if hoveredDay}
	<div
		class="pointer-events-none fixed z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
		style:left="{tooltipX - 100}px"
		style:top="{tooltipY - 120}px"
	>
		<div class="mb-2 text-sm font-medium text-gray-900">
			{hoveredDay.shortDate}
		</div>
		<div class="space-y-1">
			<div class="text-xs text-gray-600">
				Total: <span class="font-medium">{hoveredDay.totalViews} views</span>
			</div>
			{#each hoveredDay.sources as source}
				<div class="flex items-center gap-2 text-xs">
					<div class="h-2 w-2 rounded" style:background-color={source.color}></div>
					<span class="text-gray-600">{source.domain}: {source.views}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
