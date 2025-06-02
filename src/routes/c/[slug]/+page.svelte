<script lang="ts">
	import { page } from "$app/stores";

	let { data } = $props();

	const formatDuration = (minutes) => {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
	};

	const formatPrice = (price) => {
		if (!price || price === 0) return "Free";
		return `$${(price / 100).toFixed(2)}`;
	};
</script>

<svelte:head>
	<title>{data.company.name} - Book a Meeting</title>
	<meta
		name="description"
		content={data.company.description || `Book a meeting with ${data.company.name}`}
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex items-center gap-4">
				{#if data.company.logo}
					<img
						src={data.company.logo}
						alt="{data.company.name} logo"
						class="h-12 w-12 rounded-lg object-cover"
					/>
				{:else}
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 font-semibold text-white"
					>
						{data.company.name.charAt(0).toUpperCase()}
					</div>
				{/if}
				<div>
					<h1 class="text-2xl font-bold text-gray-900">{data.company.name}</h1>
					{#if data.company.description}
						<p class="text-gray-600">{data.company.description}</p>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
		{#if data.meetingTypes.length > 0}
			<div class="mb-8">
				<h2 class="mb-6 text-xl font-semibold text-gray-900">Available Meeting Types</h2>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each data.meetingTypes as meetingType}
						<div
							class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
						>
							<div class="mb-4">
								<h3 class="text-lg font-semibold text-gray-900">{meetingType.name}</h3>
								{#if meetingType.description}
									<p class="mt-2 text-sm text-gray-600">{meetingType.description}</p>
								{/if}
							</div>

							<div class="mb-4 space-y-2">
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									{formatDuration(meetingType.duration)}
								</div>

								{#if meetingType.price && meetingType.price > 0}
									<div class="flex items-center gap-2 text-sm text-gray-600">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
											></path>
										</svg>
										{formatPrice(meetingType.price)}
									</div>
								{/if}

								{#if meetingType.location}
									<div class="flex items-center gap-2 text-sm text-gray-600">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											></path>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											></path>
										</svg>
										{meetingType.location}
									</div>
								{/if}
							</div>

							<a
								href="/c/{data.company.slug}/schedule/{meetingType.slug}"
								class="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
							>
								Book Meeting
							</a>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					></path>
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-900">No Meeting Types Available</h3>
				<p class="mt-2 text-gray-600">This company hasn't set up any meeting types yet.</p>
			</div>
		{/if}

		<!-- Company Contact Information -->
		{#if data.company.email || data.company.phone || data.company.address}
			<div class="mt-12 rounded-lg border border-gray-200 bg-white p-6">
				<h3 class="mb-4 text-lg font-semibold text-gray-900">Contact Information</h3>
				<div class="space-y-3">
					{#if data.company.email}
						<div class="flex items-center gap-3">
							<svg
								class="h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								></path>
							</svg>
							<a href="mailto:{data.company.email}" class="text-blue-600 hover:underline">
								{data.company.email}
							</a>
						</div>
					{/if}

					{#if data.company.phone}
						<div class="flex items-center gap-3">
							<svg
								class="h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
								></path>
							</svg>
							<a href="tel:{data.company.phone}" class="text-blue-600 hover:underline">
								{data.company.phone}
							</a>
						</div>
					{/if}

					{#if data.company.address}
						<div class="flex items-start gap-3">
							<svg
								class="mt-0.5 h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								></path>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								></path>
							</svg>
							<span class="text-gray-600">{data.company.address}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</main>
</div>
