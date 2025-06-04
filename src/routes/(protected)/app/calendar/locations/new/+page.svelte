<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data } = $props();

	// Form state
	let loading = $state(false);

	// Form data with default values
	let formData = $state({
		type: "in-person",
		name: "",
		description: "",
		isDefault: false,

		// In-person fields
		address: "",
		city: "",
		state: "",
		country: "",
		postalCode: "",
		phone: "",
		contactPerson: "",
		instructions: "",

		// Virtual fields
		platform: "google-meet",
		autoGenerateLink: false,
		customMeetingUrl: "",
		meetingInstructions: "",
	});

	// Validation
	let isFormValid = $derived(() => {
		if (!formData.name.trim()) return false;

		if (formData.type === "in-person") {
			return formData.address.trim() !== "";
		} else {
			// Virtual meeting validation
			if (formData.platform === "custom") {
				return formData.customMeetingUrl.trim() !== "";
			}
			return true;
		}
	});

	function handleSubmit() {
		if (!isFormValid) {
			return () => {};
		}

		loading = true;
		return async ({ result, update }) => {
			if (result.type === "redirect") {
				goto(result.location);
			} else {
				await update();
				loading = false;
			}
		};
	}

	// Platform display names
	const platformOptions = [
		{ value: "google-meet", label: "Google Meet" },
		{ value: "zoom", label: "Zoom" },
		{ value: "teams", label: "Microsoft Teams" },
		{ value: "custom", label: "Custom Platform" },
	];
</script>

<svelte:head>
	<title>Create Location | Calendar</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<nav class="mb-2 flex items-center space-x-2 text-sm text-gray-500">
				<a href="/app/calendar" class="hover:text-gray-700">Calendar</a>
				<span>→</span>
				<a href="/app/calendar/locations" class="hover:text-gray-700">Locations</a>
				<span>→</span>
				<span class="text-gray-900">New</span>
			</nav>
			<h1 class="text-2xl font-semibold text-gray-900">Create Location</h1>
			<p class="text-gray-600">Add a new location for your meetings</p>
		</div>
		<div class="flex items-center gap-3">
			<a href="/app/calendar/locations">
				<Button variant="outline">Cancel</Button>
			</a>
		</div>
	</div>

	<!-- Main Form -->
	<form method="POST" action="?/create" use:enhance={handleSubmit} class="space-y-8">
		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Left Column - Basic Info -->
			<div class="space-y-6">
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-medium text-gray-900">Basic Information</h2>

					<div class="space-y-4">
						<!-- Location Type -->
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700">Location Type *</label>
							<div class="grid grid-cols-2 gap-4">
								<label
									class="flex cursor-pointer items-center rounded-lg border p-4 {formData.type ===
									'in-person'
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200'}"
								>
									<input
										type="radio"
										name="type"
										value="in-person"
										bind:group={formData.type}
										class="sr-only"
									/>
									<div class="flex items-center">
										<svg
											class="mr-3 h-5 w-5 text-green-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										<div>
											<div class="font-medium">In-Person</div>
											<div class="text-sm text-gray-500">Physical location</div>
										</div>
									</div>
								</label>
								<label
									class="flex cursor-pointer items-center rounded-lg border p-4 {formData.type ===
									'virtual'
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200'}"
								>
									<input
										type="radio"
										name="type"
										value="virtual"
										bind:group={formData.type}
										class="sr-only"
									/>
									<div class="flex items-center">
										<svg
											class="mr-3 h-5 w-5 text-blue-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
										<div>
											<div class="font-medium">Virtual</div>
											<div class="text-sm text-gray-500">Online meeting</div>
										</div>
									</div>
								</label>
							</div>
						</div>

						<!-- Name -->
						<div>
							<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
								Location Name *
							</label>
							<input
								type="text"
								id="name"
								name="name"
								bind:value={formData.name}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="e.g., Main Office, Google Meet Room"
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
								rows="3"
								bind:value={formData.description}
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="Optional description of this location"
							></textarea>
						</div>

						<!-- Default Location -->
						<div>
							<label for="isDefault" class="flex items-center">
								<input
									id="isDefault"
									name="isDefault"
									type="checkbox"
									bind:checked={formData.isDefault}
									class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<span class="text-sm font-medium text-gray-700">Set as default location</span>
							</label>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column - Location Details -->
			<div class="space-y-6">
				{#if formData.type === "in-person"}
					<!-- In-Person Location Details -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-medium text-gray-900">Location Details</h2>

						<div class="space-y-4">
							<!-- Address -->
							<div>
								<label for="address" class="mb-1 block text-sm font-medium text-gray-700"
									>Address *</label
								>
								<input
									id="address"
									name="address"
									type="text"
									bind:value={formData.address}
									required
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="Street address"
								/>
							</div>

							<!-- City & State -->
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="city" class="mb-1 block text-sm font-medium text-gray-700">City</label
									>
									<input
										id="city"
										name="city"
										type="text"
										bind:value={formData.city}
										class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="City"
									/>
								</div>
								<div>
									<label for="state" class="mb-1 block text-sm font-medium text-gray-700"
										>State/Province</label
									>
									<input
										id="state"
										name="state"
										type="text"
										bind:value={formData.state}
										class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="State or Province"
									/>
								</div>
							</div>

							<!-- Country & Postal Code -->
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="country" class="mb-1 block text-sm font-medium text-gray-700"
										>Country</label
									>
									<input
										id="country"
										name="country"
										type="text"
										bind:value={formData.country}
										class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="Country"
									/>
								</div>
								<div>
									<label for="postalCode" class="mb-1 block text-sm font-medium text-gray-700"
										>Postal Code</label
									>
									<input
										id="postalCode"
										name="postalCode"
										type="text"
										bind:value={formData.postalCode}
										class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="Postal/ZIP code"
									/>
								</div>
							</div>

							<!-- Contact Info -->
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="phone" class="mb-1 block text-sm font-medium text-gray-700"
										>Phone</label
									>
									<input
										id="phone"
										name="phone"
										type="tel"
										bind:value={formData.phone}
										class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="Location phone number"
									/>
								</div>
								<div>
									<label for="contactPerson" class="mb-1 block text-sm font-medium text-gray-700"
										>Contact Person</label
									>
									<input
										id="contactPerson"
										name="contactPerson"
										type="text"
										bind:value={formData.contactPerson}
										class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="Contact person name"
									/>
								</div>
							</div>

							<!-- Instructions -->
							<div>
								<label for="instructions" class="mb-1 block text-sm font-medium text-gray-700"
									>Instructions</label
								>
								<textarea
									id="instructions"
									name="instructions"
									rows="3"
									bind:value={formData.instructions}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="Parking instructions, entrance details, etc."
								></textarea>
							</div>
						</div>
					</div>
				{:else}
					<!-- Virtual Meeting Details -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-medium text-gray-900">Virtual Meeting Settings</h2>

						<div class="space-y-4">
							<!-- Platform -->
							<div>
								<label for="platform" class="mb-1 block text-sm font-medium text-gray-700"
									>Platform *</label
								>
								<select
									id="platform"
									name="platform"
									bind:value={formData.platform}
									required
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									{#each platformOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</div>

							<!-- Google Meet Auto-generate -->
							{#if formData.platform === "google-meet"}
								<div>
									<label for="autoGenerateLink" class="flex items-center">
										<input
											id="autoGenerateLink"
											name="autoGenerateLink"
											type="checkbox"
											bind:checked={formData.autoGenerateLink}
											class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm font-medium text-gray-700"
											>Auto-generate Google Meet links</span
										>
									</label>
									<p class="mt-1 text-xs text-gray-500">
										When enabled, a new Google Meet link will be created for each booking
									</p>
								</div>
							{/if}

							<!-- Custom Meeting URL -->
							{#if formData.platform === "custom" || !formData.autoGenerateLink}
								<div>
									<label
										for="customMeetingUrl"
										class="mb-1 block text-sm font-medium text-gray-700"
									>
										{formData.platform === "custom" ? "Meeting URL *" : "Fixed Meeting URL"}
									</label>
									<input
										id="customMeetingUrl"
										name="customMeetingUrl"
										type="url"
										bind:value={formData.customMeetingUrl}
										required={formData.platform === "custom"}
										class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="https://meet.google.com/abc-defg-hij"
									/>
								</div>
							{/if}

							<!-- Meeting Instructions -->
							<div>
								<label
									for="meetingInstructions"
									class="mb-1 block text-sm font-medium text-gray-700">Meeting Instructions</label
								>
								<textarea
									id="meetingInstructions"
									name="meetingInstructions"
									rows="3"
									bind:value={formData.meetingInstructions}
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="How to join, dial-in numbers, access codes, etc."
								></textarea>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Form Actions -->
		<div class="flex items-center justify-end space-x-3 rounded-lg border bg-white p-6 shadow-sm">
			<a href="/app/calendar/locations">
				<Button variant="outline" disabled={loading}>Cancel</Button>
			</a>
			<Button
				type="submit"
				disabled={loading || !isFormValid}
				class="bg-blue-600 hover:bg-blue-700"
			>
				{loading ? "Creating..." : "Create Location"}
			</Button>
		</div>
	</form>
</div>
