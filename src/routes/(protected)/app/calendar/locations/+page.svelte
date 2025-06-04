<script lang="ts">
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { toast } from "$lib/utils/toast";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data, form } = $props();

	// Reactive data using $derived - automatically updates when data changes
	let locations = $derived(data.locations || []);

	// Handle form results
	$effect(() => {
		if (form?.success) {
			toast.success(form.message || "Operation completed successfully");
		} else if (form?.error) {
			toast.error(form.error || "An error occurred");
		}
	});

	async function deleteLocation(location) {
		if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
			try {
				// Create a FormData object
				const formData = new FormData();
				formData.append("id", location.id);

				// Submit the form data
				const response = await fetch("?/deleteLocation", {
					method: "POST",
					body: formData,
				});

				if (response.ok) {
					// Invalidate all data to refresh the page
					await invalidateAll();
					toast.success("Location deleted successfully");
				} else {
					toast.error("Failed to delete location");
				}
			} catch (error) {
				console.error("Error deleting location:", error);
				toast.error("Failed to delete location");
			}
		}
	}

	function handleDeleteLocation(location) {
		return () => deleteLocation(location);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-gray-900">Locations</h2>
			<p class="text-gray-600">Manage your meeting locations for in-person and virtual meetings</p>
		</div>
		<a href="/app/calendar/locations/new">
			<Button class="bg-blue-600 hover:bg-blue-700">Add Location</Button>
		</a>
	</div>

	<!-- Locations Grid -->
	{#if locations.length === 0}
		<div class="rounded-lg border bg-white p-12 text-center">
			<svg
				class="mx-auto mb-4 h-12 w-12 text-gray-300"
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
			<h3 class="text-lg font-medium text-gray-900">No locations yet</h3>
			<p class="mt-2 text-gray-500">Create your first location to organize your meetings</p>
			<a href="/app/calendar/locations/new">
				<Button class="mt-4 bg-blue-600 hover:bg-blue-700">Create Location</Button>
			</a>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each locations as location}
				<div class="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex items-center">
							<div
								class="mr-3 flex h-8 w-8 items-center justify-center rounded-full {location.type ===
								'in-person'
									? 'bg-green-100'
									: 'bg-blue-100'}"
							>
								{#if location.type === "in-person"}
									<svg
										class="h-4 w-4 text-green-600"
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
								{:else}
									<svg
										class="h-4 w-4 text-blue-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										></path>
									</svg>
								{/if}
							</div>
							<div>
								<h3 class="font-semibold text-gray-900">
									{location.name}
									{#if location.isDefault}
										<span
											class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
										>
											Default
										</span>
									{/if}
								</h3>
								<p class="text-sm capitalize text-gray-500">
									{location.type === "in-person" ? "In-Person" : "Virtual"}
									{#if location.type === "virtual" && location.platform}
										• {location.platform.replace("-", " ")}
									{/if}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<a
								href="/app/calendar/locations/{location.id}"
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
								aria-label="Edit location"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									></path>
								</svg>
							</a>
							<button
								onclick={handleDeleteLocation(location)}
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
								aria-label="Delete location"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									></path>
								</svg>
							</button>
						</div>
					</div>

					{#if location.description}
						<p class="mb-4 text-sm text-gray-600">{location.description}</p>
					{/if}

					<div class="space-y-2 text-xs text-gray-500">
						{#if location.type === "in-person"}
							{#if location.address}
								<div class="flex justify-between">
									<span>Address:</span>
									<span class="text-right font-medium">{location.address}</span>
								</div>
							{/if}
							{#if location.phone}
								<div class="flex justify-between">
									<span>Phone:</span>
									<span class="font-medium">{location.phone}</span>
								</div>
							{/if}
						{:else if location.customMeetingUrl}
							<div class="flex justify-between">
								<span>Meeting URL:</span>
								<span class="font-medium">Custom URL</span>
							</div>
						{:else if location.autoGenerateLink}
							<div class="flex justify-between">
								<span>Meeting URL:</span>
								<span class="font-medium text-blue-600">Auto-generated</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
