<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data } = $props();

	// Form state
	let loading = $state(false);
	let selectedTemplateIds = $state(new Set());

	// Form data with default values
	let formData = $state({
		name: "",
		description: "",
		duration: 30,
		price: 0,
		color: "#3b82f6",
		requiresConfirmation: false,
		bufferTimeBefore: 0,
		bufferTimeAfter: 0,
		selectedCalendarId: "",
		locationId: "",
	});

	// Set default values when data loads
	$effect(() => {
		if (data.availableCalendars.length > 0 && !formData.selectedCalendarId) {
			const defaultCalendar =
				data.availableCalendars.find((c) => c.primary) || data.availableCalendars[0];
			formData.selectedCalendarId = defaultCalendar.id;
		}

		// Pre-select default templates
		if (data.availabilityTemplates.length > 0 && selectedTemplateIds.size === 0) {
			const defaultTemplates = data.availabilityTemplates.filter((t) => t.isDefault);
			if (defaultTemplates.length > 0) {
				defaultTemplates.forEach((template) => selectedTemplateIds.add(template.id));
			}
		}
	});

	// Validation
	let isFormValid = $derived(
		formData.name.trim() !== "" &&
			selectedTemplateIds.size > 0 &&
			formData.selectedCalendarId !== ""
	);

	function toggleTemplate(templateId) {
		if (selectedTemplateIds.has(templateId)) {
			selectedTemplateIds.delete(templateId);
		} else {
			selectedTemplateIds.add(templateId);
		}
		// Trigger reactivity
		selectedTemplateIds = new Set(selectedTemplateIds);
	}

	function handleSubmit() {
		// Validate before submission
		if (!isFormValid) {
			return () => {};
		}

		loading = true;
		return async ({ result, update }) => {
			if (result.type === "redirect") {
				// Keep loading state active during redirect
				goto(result.location);
			} else {
				await update();
				loading = false;
			}
		};
	}

	function getCalendarName(calendarId) {
		if (!calendarId) return "Company Default";
		const calendar = data.availableCalendars.find((c) => c.id === calendarId);
		return calendar?.summary || "Unknown Calendar";
	}

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
	<title>Create Meeting Type | Calendar</title>
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
				<span class="text-gray-900">New</span>
			</nav>
			<h1 class="text-2xl font-semibold text-gray-900">Create Meeting Type</h1>
			<p class="text-gray-600">Set up a new meeting type for your calendar</p>
		</div>
		<div class="flex items-center gap-3">
			<a href="/app/calendar/meetings">
				<Button variant="outline">Cancel</Button>
			</a>
		</div>
	</div>

	<!-- Prerequisites Check -->
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
	{:else if data.availabilityTemplates.length === 0}
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
					<h3 class="text-sm font-medium text-yellow-800">No Availability Templates</h3>
					<p class="mt-1 text-sm text-yellow-700">
						You need to create availability templates before creating meeting types.
						<a href="/app/calendar/availability" class="font-medium underline">Create templates</a>
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Main Form -->
		<form
			method="POST"
			action="/app/calendar/meetings?/createMeetingType"
			use:enhance={handleSubmit}
			class="space-y-8"
		>
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
								{#if $page.form?.error && $page.form.error.includes("Name")}
									<p class="mt-1 text-sm text-red-600">{$page.form.error}</p>
								{/if}
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

					<!-- Availability Templates -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-medium text-gray-900">Availability Templates</h2>

						<div class="space-y-3">
							<p class="mb-3 text-sm text-gray-600">
								Select which availability templates this meeting type should use. At least one
								template is required.
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
											onchange={() => toggleTemplate(template.id)}
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
								<label
									for="selectedCalendarId"
									class="mb-1 block text-sm font-medium text-gray-700"
								>
									Calendar for Events *
								</label>
								<select
									id="selectedCalendarId"
									name="selectedCalendarId"
									bind:value={formData.selectedCalendarId}
									required
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									<option value="">Select calendar</option>
									{#each data.availableCalendars as calendar}
										<option value={calendar.id}>
											{calendar.summary}
											{calendar.primary ? "(Primary)" : ""}
										</option>
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

					<!-- Preview -->
					{#if formData.selectedCalendarId}
						<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
							<div class="flex items-start">
								<svg class="mt-0.5 h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									></path>
								</svg>
								<div class="ml-3">
									<h4 class="text-sm font-medium text-blue-800">Calendar Integration</h4>
									<p class="mt-1 text-sm text-blue-700">
										Events will be created in: <strong
											>{getCalendarName(formData.selectedCalendarId)}</strong
										>
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Hidden inputs for selected template IDs -->
			{#each Array.from(selectedTemplateIds) as templateId}
				<input type="hidden" name="availabilityTemplateIds" value={templateId} />
			{/each}

			<!-- Form Actions -->
			<div class="flex items-center justify-end space-x-3 border-t pt-6">
				<a href="/app/calendar/meetings">
					<Button variant="outline" disabled={loading}>Cancel</Button>
				</a>
				<Button
					type="submit"
					disabled={loading ||
						!data.isCalendarConnected ||
						data.availabilityTemplates.length === 0 ||
						!isFormValid}
				>
					{loading ? "Creating..." : "Create Meeting Type"}
				</Button>
			</div>

			<!-- Error Display -->
			{#if $page.form?.error}
				<div class="rounded-md bg-red-50 p-4">
					<div class="flex">
						<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							></path>
						</svg>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">Error</h3>
							<p class="mt-1 text-sm text-red-700">{$page.form.error}</p>
						</div>
					</div>
				</div>
			{/if}
		</form>
	{/if}
</div>
