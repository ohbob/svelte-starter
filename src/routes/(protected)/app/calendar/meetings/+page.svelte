<script lang="ts">
	import { enhance } from "$app/forms";
	import { toast } from "$lib/utils/toast";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data, form } = $props();

	// State
	let meetingTypes = $state([]);
	let showMeetingTypeForm = $state(false);
	let editingMeetingType = $state(null);

	// Meeting type form
	let meetingTypeForm = $state({
		name: "",
		description: "",
		duration: 30,
		price: 0,
		color: "#3b82f6",
		requiresConfirmation: false,
		bufferTimeBefore: 0,
		bufferTimeAfter: 0,
	});

	// Data sync
	$effect(() => {
		meetingTypes = data.meetingTypes || [];
	});

	// Handle form results
	$effect(() => {
		if (form?.success) {
			toast.success(form.message || "Operation completed successfully");
			showMeetingTypeForm = false;
			resetMeetingTypeForm();
		} else if (form?.error) {
			toast.error(form.error || "An error occurred");
		}
	});

	function resetMeetingTypeForm() {
		editingMeetingType = null;
		meetingTypeForm = {
			name: "",
			description: "",
			duration: 30,
			price: 0,
			color: "#3b82f6",
			requiresConfirmation: false,
			bufferTimeBefore: 0,
			bufferTimeAfter: 0,
		};
	}

	function editMeetingType(meetingType) {
		editingMeetingType = meetingType;
		meetingTypeForm = {
			name: meetingType.name,
			description: meetingType.description || "",
			duration: meetingType.duration,
			price: meetingType.price,
			color: meetingType.color,
			requiresConfirmation: meetingType.requiresConfirmation,
			bufferTimeBefore: meetingType.bufferTimeBefore || 0,
			bufferTimeAfter: meetingType.bufferTimeAfter || 0,
		};
		showMeetingTypeForm = true;
	}

	function deleteMeetingType(meetingType) {
		if (confirm(`Are you sure you want to delete "${meetingType.name}"?`)) {
			const form = document.createElement("form");
			form.method = "POST";
			form.action = "?/deleteMeetingType";
			form.style.display = "none";

			const input = document.createElement("input");
			input.type = "hidden";
			input.name = "id";
			input.value = meetingType.id;
			form.appendChild(input);

			document.body.appendChild(form);
			form.submit();
			document.body.removeChild(form);
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
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-gray-900">Meeting Types</h2>
			<p class="text-gray-600">Create and manage different types of meetings for your calendar</p>
		</div>
		<Button
			onclick={() => (showMeetingTypeForm = true)}
			disabled={!data.isCalendarConnected}
			class="bg-blue-600 hover:bg-blue-700"
		>
			Add Meeting Type
		</Button>
	</div>

	<!-- Connection Warning -->
	{#if !data.isCalendarConnected}
		<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
			<div class="flex">
				<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					></path>
				</svg>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-yellow-800">Calendar Not Connected</h3>
					<p class="mt-1 text-sm text-yellow-700">
						You need to connect your Google Calendar before creating meeting types.
						<a href="/app/calendar" class="font-medium underline">Connect now</a>
					</p>
				</div>
			</div>
		</div>
	{/if}

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
			{#if data.isCalendarConnected}
				<Button
					onclick={() => (showMeetingTypeForm = true)}
					class="mt-4 bg-blue-600 hover:bg-blue-700"
				>
					Create Meeting Type
				</Button>
			{/if}
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
							<button
								onclick={() => editMeetingType(meetingType)}
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
							</button>
							<button
								onclick={() => deleteMeetingType(meetingType)}
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
						<div class="flex justify-between">
							<span>Calendar:</span>
							<span class="font-medium">To be selected</span>
						</div>
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

<!-- Meeting Type Form Modal -->
{#if showMeetingTypeForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-md rounded-lg bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">
				{editingMeetingType ? "Edit Meeting Type" : "Create Meeting Type"}
			</h3>

			<form
				method="POST"
				action={editingMeetingType ? "?/updateMeetingType" : "?/createMeetingType"}
				use:enhance
				class="space-y-4"
			>
				{#if editingMeetingType}
					<input type="hidden" name="id" value={editingMeetingType.id} />
				{/if}

				<div>
					<label for="meetingName" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
					<input
						type="text"
						id="meetingName"
						name="name"
						bind:value={meetingTypeForm.name}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="30 Minute Meeting"
					/>
				</div>

				<div>
					<label for="meetingDescription" class="mb-1 block text-sm font-medium text-gray-700"
						>Description</label
					>
					<textarea
						id="meetingDescription"
						name="description"
						bind:value={meetingTypeForm.description}
						rows="3"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Brief description of the meeting"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="meetingDuration" class="mb-1 block text-sm font-medium text-gray-700"
							>Duration (minutes)</label
						>
						<input
							type="number"
							id="meetingDuration"
							name="duration"
							bind:value={meetingTypeForm.duration}
							min="15"
							max="480"
							step="15"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="meetingPrice" class="mb-1 block text-sm font-medium text-gray-700"
							>Price (cents)</label
						>
						<input
							type="number"
							id="meetingPrice"
							name="price"
							bind:value={meetingTypeForm.price}
							min="0"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0 for free"
						/>
					</div>
				</div>

				<div>
					<label for="meetingColor" class="mb-1 block text-sm font-medium text-gray-700"
						>Color</label
					>
					<input
						type="color"
						id="meetingColor"
						name="color"
						bind:value={meetingTypeForm.color}
						class="h-10 w-full rounded-md border border-gray-300"
					/>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						name="requiresConfirmation"
						bind:checked={meetingTypeForm.requiresConfirmation}
						id="requiresConfirmation"
						class="mr-2"
					/>
					<label for="requiresConfirmation" class="text-sm text-gray-700">
						Requires confirmation before booking
					</label>
				</div>

				<div class="flex justify-end gap-3 pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							showMeetingTypeForm = false;
							resetMeetingTypeForm();
						}}
					>
						Cancel
					</Button>
					<Button type="submit" class="bg-blue-600 hover:bg-blue-700">
						{editingMeetingType ? "Update Meeting Type" : "Create Meeting Type"}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
