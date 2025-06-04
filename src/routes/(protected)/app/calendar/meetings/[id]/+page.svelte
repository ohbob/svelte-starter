<script lang="ts">
	import { page } from "$app/stores";
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data } = $props();

	// Form state
	let showDeleteConfirm = $state(false);
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let selectedTemplateIds = $state(new Set());
	let isInitialized = $state(false);

	// Form data
	let formData = $state({
		name: data.meetingType.name,
		description: data.meetingType.description || "",
		duration: data.meetingType.duration,
		price: data.meetingType.price || 0,
		color: data.meetingType.color || "#3b82f6",
		requiresConfirmation: data.meetingType.requiresConfirmation,
		bufferTimeBefore: data.meetingType.bufferTimeBefore || 0,
		bufferTimeAfter: data.meetingType.bufferTimeAfter || 0,
		selectedCalendarId: data.meetingType.selectedCalendarId || "",
		locationId: data.meetingType.locationId || "",
	});

	// Initialize selected templates only once
	$effect(() => {
		if (
			!isInitialized &&
			data.meetingType.availabilityTemplates &&
			data.meetingType.availabilityTemplates.length > 0
		) {
			const templateIds = new Set(data.meetingType.availabilityTemplates.map((t) => t.id));
			selectedTemplateIds = templateIds;
			isInitialized = true;
		}
	});

	// Validation
	let isFormValid = $derived(formData.name.trim() !== "" && selectedTemplateIds.size > 0);

	function toggleTemplate(templateId) {
		if (selectedTemplateIds.has(templateId)) {
			selectedTemplateIds.delete(templateId);
		} else {
			selectedTemplateIds.add(templateId);
		}
		// Trigger reactivity
		selectedTemplateIds = new Set(selectedTemplateIds);
	}

	function handleTemplateChange(templateId) {
		return () => toggleTemplate(templateId);
	}

	function getCalendarName(calendarId) {
		if (!calendarId) return "Company Default";
		const calendar = data.availableCalendars.find((c) => c.id === calendarId);
		return calendar?.summary || "Unknown Calendar";
	}

	function showDeleteModal() {
		showDeleteConfirm = true;
	}

	function hideDeleteModal() {
		showDeleteConfirm = false;
	}

	// Enhanced form submission for update
	const handleUpdateSubmit = () => {
		isSubmitting = true;
		return async ({ result, update }) => {
			if (result.type === "redirect") {
				goto(result.location);
			} else {
				await update();
				isSubmitting = false;
			}
		};
	};

	// Enhanced form submission for delete
	const handleDeleteSubmit = () => {
		isDeleting = true;
		return async ({ result, update }) => {
			if (result.type === "redirect") {
				goto(result.location);
			} else {
				await update();
				isDeleting = false;
			}
		};
	};

	// Duration options
	const durationOptions = [
		{ value: 15, label: "15 minutes" },
		{ value: 30, label: "30 minutes" },
		{ value: 45, label: "45 minutes" },
		{ value: 60, label: "1 hour" },
		{ value: 90, label: "1.5 hours" },
		{ value: 120, label: "2 hours" },
		{ value: 180, label: "3 hours" },
	];

	// Color options
	const colorOptions = [
		{ value: "#3b82f6", label: "Blue", class: "bg-blue-500" },
		{ value: "#10b981", label: "Green", class: "bg-green-500" },
		{ value: "#f59e0b", label: "Yellow", class: "bg-yellow-500" },
		{ value: "#ef4444", label: "Red", class: "bg-red-500" },
		{ value: "#8b5cf6", label: "Purple", class: "bg-purple-500" },
		{ value: "#06b6d4", label: "Cyan", class: "bg-cyan-500" },
		{ value: "#84cc16", label: "Lime", class: "bg-lime-500" },
		{ value: "#f97316", label: "Orange", class: "bg-orange-500" },
	];
</script>

<svelte:head>
	<title>Edit {data.meetingType.name} | Calendar</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<nav class="mb-2 flex items-center space-x-2 text-sm text-gray-500">
				<a href="/app/calendar" class="hover:text-gray-700">Calendar</a>
				<span>→</span>
				<a href="/app/calendar/meetings" class="hover:text-gray-700">Meeting Types</a>
				<span>→</span>
				<span class="text-gray-900">Edit</span>
			</nav>
			<h1 class="text-2xl font-semibold text-gray-900">Edit Meeting Type</h1>
			<p class="text-gray-600">Update your meeting type settings and availability</p>
		</div>
		<div class="flex items-center gap-3">
			<a href="/app/calendar/meetings">
				<Button variant="outline">Cancel</Button>
			</a>
			<Button variant="destructive" onclick={showDeleteModal}>Delete</Button>
		</div>
	</div>

	<!-- Main Form -->
	<form method="POST" action="?/update" use:enhance={handleUpdateSubmit} class="space-y-8">
		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Left Column - Basic Info -->
			<div class="space-y-6">
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-medium text-gray-900">Basic Information</h2>

					<div class="space-y-4">
						<!-- Name -->
						<div>
							<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
								Meeting Name *
							</label>
							<input
								type="text"
								id="name"
								name="name"
								bind:value={formData.name}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="e.g., 30 Minute Consultation"
							/>
						</div>

						<!-- Description -->
						<div>
							<label for="description" class="mb-1 block text-sm font-medium text-gray-700">
								Description
							</label>
							<textarea
								id="description"
								name="description"
								bind:value={formData.description}
								rows="3"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="Describe what this meeting is for..."
							></textarea>
						</div>

						<!-- Duration -->
						<div>
							<label for="duration" class="mb-1 block text-sm font-medium text-gray-700">
								Duration *
							</label>
							<select
								id="duration"
								name="duration"
								bind:value={formData.duration}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								{#each durationOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<!-- Price -->
						<div>
							<label for="price" class="mb-1 block text-sm font-medium text-gray-700">
								Price (cents)
							</label>
							<input
								type="number"
								id="price"
								name="price"
								bind:value={formData.price}
								min="0"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="0 for free"
							/>
							<p class="mt-1 text-xs text-gray-500">
								Enter 0 for free meetings, or amount in cents (e.g., 5000 = $50.00)
							</p>
						</div>

						<!-- Color -->
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700">Color</label>
							<div class="grid grid-cols-4 gap-2">
								{#each colorOptions as color}
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="radio"
											name="color"
											value={color.value}
											bind:group={formData.color}
											class="sr-only"
										/>
										<div
											class="flex items-center space-x-2 rounded-md border p-2 {formData.color ===
											color.value
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 hover:border-gray-300'}"
										>
											<div class="h-4 w-4 rounded-full {color.class}"></div>
											<span class="text-xs">{color.label}</span>
										</div>
									</label>
								{/each}
							</div>
						</div>

						<!-- Location -->
						<div>
							<label for="locationId" class="mb-1 block text-sm font-medium text-gray-700">
								Location
							</label>
							<select
								id="locationId"
								name="locationId"
								bind:value={formData.locationId}
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="">No location assigned</option>
								{#each data.locations as location}
									<option value={location.id}>
										{location.name} ({location.type === "in-person" ? "In-Person" : "Virtual"})
									</option>
								{/each}
							</select>
							<p class="mt-1 text-xs text-gray-500">
								Choose a location for this meeting type. <a
									href="/app/calendar/locations"
									class="text-blue-600 hover:text-blue-800">Manage locations</a
								>
							</p>
						</div>
					</div>
				</div>

				<!-- Availability Template -->
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-medium text-gray-900">Availability Templates</h2>

					<div class="space-y-3">
						<p class="mb-3 text-sm text-gray-600">
							Select which availability templates this meeting type should use. If none are
							selected, the company default will be used.
						</p>

						{#if data.availabilityTemplates.length === 0}
							<div class="text-sm italic text-gray-500">
								No availability templates found. <a
									href="/app/calendar/availability/new"
									class="text-blue-600 hover:text-blue-800">Create one</a
								> to get started.
							</div>
						{:else}
							{#each data.availabilityTemplates as template}
								<label
									class="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50"
								>
									<input
										type="checkbox"
										name="availabilityTemplateIds"
										value={template.id}
										checked={selectedTemplateIds.has(template.id)}
										onchange={handleTemplateChange(template.id)}
										class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium text-gray-900">{template.name}</span>
											{#if template.isDefault}
												<span
													class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
												>
													Default
												</span>
											{/if}
										</div>
										{#if template.description}
											<p class="mt-1 text-xs text-gray-500">{template.description}</p>
										{/if}
										<p class="mt-1 text-xs text-gray-400">
											{template.slots?.length || 0} time slots configured
										</p>
									</div>
								</label>
							{/each}

							{#if selectedTemplateIds.size === 0}
								<div class="mt-2 text-sm text-red-600">
									Please select at least one availability template.
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>

			<!-- Right Column - Advanced Settings -->
			<div class="space-y-6">
				<!-- Calendar Integration -->
				{#if data.isCalendarConnected}
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-medium text-gray-900">Calendar Integration</h2>

						<div>
							<label for="selectedCalendarId" class="mb-1 block text-sm font-medium text-gray-700">
								Calendar for Events
							</label>
							<select
								id="selectedCalendarId"
								name="selectedCalendarId"
								bind:value={formData.selectedCalendarId}
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="">Company Default ({getCalendarName("")})</option>
								{#each data.availableCalendars as calendar}
									<option value={calendar.id}>{calendar.summary}</option>
								{/each}
							</select>
							<p class="mt-1 text-xs text-gray-500">
								Choose which calendar to create events in for this meeting type
							</p>
						</div>
					</div>
				{/if}

				<!-- Buffer Times -->
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-medium text-gray-900">Buffer Times</h2>

					<div class="space-y-4">
						<div>
							<label for="bufferTimeBefore" class="mb-1 block text-sm font-medium text-gray-700">
								Buffer Before (minutes)
							</label>
							<input
								type="number"
								id="bufferTimeBefore"
								name="bufferTimeBefore"
								bind:value={formData.bufferTimeBefore}
								min="0"
								max="120"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="bufferTimeAfter" class="mb-1 block text-sm font-medium text-gray-700">
								Buffer After (minutes)
							</label>
							<input
								type="number"
								id="bufferTimeAfter"
								name="bufferTimeAfter"
								bind:value={formData.bufferTimeAfter}
								min="0"
								max="120"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
					</div>
					<p class="mt-2 text-xs text-gray-500">
						Add time before/after meetings to prevent back-to-back bookings
					</p>
				</div>

				<!-- Booking Settings -->
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-medium text-gray-900">Booking Settings</h2>

					<div class="space-y-4">
						<label class="flex items-center space-x-3">
							<input
								type="checkbox"
								name="requiresConfirmation"
								bind:checked={formData.requiresConfirmation}
								class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<div>
								<span class="text-sm font-medium text-gray-700">Require Confirmation</span>
								<p class="text-xs text-gray-500">
									Bookings need manual approval before being confirmed
								</p>
							</div>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Hidden inputs for selected template IDs -->
		{#each Array.from(selectedTemplateIds) as templateId}
			<input type="hidden" name="availabilityTemplateIds" value={templateId} />
		{/each}

		<!-- Form Actions -->
		<div class="flex items-center justify-end space-x-3 border-t pt-6">
			<a href="/app/calendar/meetings">
				<Button variant="outline">Cancel</Button>
			</a>
			<Button type="submit" disabled={isSubmitting || !isFormValid}>
				{isSubmitting ? "Updating..." : "Update Meeting Type"}
			</Button>
		</div>
	</form>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-2 text-lg font-medium text-gray-900">Delete Meeting Type</h3>
			<p class="mb-4 text-sm text-gray-600">
				Are you sure you want to delete "{data.meetingType.name}"? This action cannot be undone and
				will cancel all existing bookings.
			</p>
			<div class="flex items-center justify-end space-x-3">
				<Button variant="outline" onclick={hideDeleteModal} disabled={isDeleting}>Cancel</Button>
				<form method="POST" action="?/delete" use:enhance={handleDeleteSubmit} class="inline">
					<Button variant="destructive" type="submit" disabled={isDeleting}>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</form>
			</div>
		</div>
	</div>
{/if}
