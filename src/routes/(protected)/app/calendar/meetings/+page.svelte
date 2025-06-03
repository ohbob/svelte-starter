<script lang="ts">
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { toast } from "$lib/utils/toast";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data, form } = $props();

	// Reactive data using $derived - automatically updates when data changes
	let meetingTypes = $derived(data.meetingTypes || []);

	// Handle form results
	$effect(() => {
		if (form?.success) {
			toast.success(form.message || "Operation completed successfully");
		} else if (form?.error) {
			toast.error(form.error || "An error occurred");
		}
	});

	async function deleteMeetingType(meetingType) {
		if (confirm(`Are you sure you want to delete "${meetingType.name}"?`)) {
			try {
				// Create a FormData object
				const formData = new FormData();
				formData.append("id", meetingType.id);

				// Submit the form data
				const response = await fetch("?/deleteMeetingType", {
					method: "POST",
					body: formData,
				});

				if (response.ok) {
					// Invalidate all data to refresh the page
					await invalidateAll();
					toast.success("Meeting type deleted successfully");
				} else {
					toast.error("Failed to delete meeting type");
				}
			} catch (error) {
				console.error("Error deleting meeting type:", error);
				toast.error("Failed to delete meeting type");
			}
		}
	}

	function formatDuration(minutes) {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	function formatPrice(cents) {
		if (cents === 0) return "Free";
		return `$${(cents / 100).toFixed(2)}`;
	}

	function handleDeleteMeetingType(meetingType) {
		return () => deleteMeetingType(meetingType);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-gray-900">Meeting Types</h2>
			<p class="text-gray-600">Create and manage different types of meetings for your calendar</p>
		</div>
		<a href="/app/calendar/meetings/new">
			<Button class="bg-blue-600 hover:bg-blue-700">Add Meeting Type</Button>
		</a>
	</div>

	<!-- Meeting Types Grid -->
	{#if meetingTypes.length === 0}
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
					d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
				></path>
			</svg>
			<h3 class="text-lg font-medium text-gray-900">No meeting types yet</h3>
			<p class="mt-2 text-gray-500">Create your first meeting type to start accepting bookings</p>
			<a href="/app/calendar/meetings/new">
				<Button class="mt-4 bg-blue-600 hover:bg-blue-700">Create Meeting Type</Button>
			</a>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each meetingTypes as meetingType}
				<div class="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex items-center">
							<div
								class="mr-3 h-4 w-4 rounded-full"
								style:background-color={meetingType.color}
							></div>
							<div>
								<h3 class="font-semibold text-gray-900">{meetingType.name}</h3>
								<p class="text-sm text-gray-500">
									{formatDuration(meetingType.duration)} • {formatPrice(meetingType.price)}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<a
								href="/app/calendar/meetings/{meetingType.id}"
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
								aria-label="Edit meeting"
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
								onclick={handleDeleteMeetingType(meetingType)}
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
								aria-label="Delete meeting"
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

					{#if meetingType.description}
						<p class="mb-4 text-sm text-gray-600">{meetingType.description}</p>
					{/if}

					<div class="space-y-2 text-xs text-gray-500">
						{#if meetingType.requiresConfirmation}
							<div class="flex justify-between">
								<span>Confirmation:</span>
								<span class="font-medium text-yellow-600">Required</span>
							</div>
						{/if}
						{#if meetingType.bufferTimeBefore || meetingType.bufferTimeAfter}
							<div class="flex justify-between">
								<span>Buffer:</span>
								<span class="font-medium">
									{meetingType.bufferTimeBefore}m before, {meetingType.bufferTimeAfter}m after
								</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
