<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import {
		FormField,
		FormTextarea,
		FormSelect,
		Card,
		LoadingSpinner,
		FormCheckbox,
	} from "$lib/components/ui";

	let loading = $state(true);
	let saving = $state(false);

	// Booking & CTA form data
	let bookingSettings = $state({
		primary_cta_text: "Book Now",
		secondary_cta_text: "Get Quote",
		booking_url: "",
		phone_cta_enabled: true,
		phone_number: "",
		email_cta_enabled: true,
		email_address: "",
		contact_form_enabled: true,
		online_booking_enabled: false,
		booking_platform: "",
		calendar_integration: "",
		appointment_types: [],
		booking_instructions: "",
		availability_display: "business_hours",
	});

	const bookingPlatforms = [
		"Calendly",
		"Acuity Scheduling",
		"Square Appointments",
		"Booksy",
		"Setmore",
		"SimplyBook.me",
		"Custom Solution",
		"Other",
	];

	const calendarIntegrations = ["Google Calendar", "Outlook Calendar", "Apple Calendar", "Other"];

	const availabilityOptions = [
		{ value: "business_hours", label: "Show business hours only" },
		{ value: "real_time", label: "Show real-time availability" },
		{ value: "contact_only", label: "Contact for availability" },
	];

	onMount(async () => {
		await loadBookingSettings();
	});

	async function loadBookingSettings() {
		loading = true;
		try {
			const response = await fetch("/api/company/booking");
			if (response.ok) {
				const data = await response.json();
				if (data.bookingSettings) {
					bookingSettings = { ...bookingSettings, ...data.bookingSettings };
				}
			}
		} catch (error) {
			console.error("Error loading booking settings:", error);
			toast.error("Failed to load booking settings");
		} finally {
			loading = false;
		}
	}

	async function saveBookingSettings() {
		saving = true;
		try {
			const response = await fetch("/api/company/booking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bookingSettings),
			});

			if (response.ok) {
				toast.success("Booking settings saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save booking settings");
			}
		} catch (error) {
			console.error("Error saving booking settings:", error);
			toast.error("Failed to save booking settings");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveBookingSettings();
	}

	function addAppointmentType() {
		bookingSettings.appointment_types = [
			...bookingSettings.appointment_types,
			{
				name: "",
				duration: 60,
				description: "",
			},
		];
	}

	function removeAppointmentType(index) {
		bookingSettings.appointment_types = bookingSettings.appointment_types.filter(
			(_, i) => i !== index
		);
	}

	function handleRemoveAppointmentType(index) {
		return () => removeAppointmentType(index);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="two-column-layout">
				<div class="form-section">
					<Card title="Call-to-Action Settings">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Primary CTA Text"
									bind:value={bookingSettings.primary_cta_text}
									placeholder="Book Now"
								/>

								<FormField
									label="Secondary CTA Text"
									bind:value={bookingSettings.secondary_cta_text}
									placeholder="Get Quote"
								/>

								<FormField
									label="Booking URL"
									type="url"
									bind:value={bookingSettings.booking_url}
									placeholder="https://calendly.com/yourbusiness"
								/>
							</div>
						{/snippet}
					</Card>

					<Card title="Contact Options">
						{#snippet children()}
							<div class="form-group">
								<div class="space-y-4">
									<div>
										<FormCheckbox
											label="Enable phone CTA"
											bind:checked={bookingSettings.phone_cta_enabled}
										/>
										{#if bookingSettings.phone_cta_enabled}
											<FormField
												label="Phone Number"
												type="tel"
												bind:value={bookingSettings.phone_number}
												placeholder="(555) 123-4567"
											/>
										{/if}
									</div>

									<div>
										<FormCheckbox
											label="Enable email CTA"
											bind:checked={bookingSettings.email_cta_enabled}
										/>
										{#if bookingSettings.email_cta_enabled}
											<FormField
												label="Email Address"
												type="email"
												bind:value={bookingSettings.email_address}
												placeholder="contact@business.com"
											/>
										{/if}
									</div>

									<FormCheckbox
										label="Enable contact form"
										bind:checked={bookingSettings.contact_form_enabled}
									/>
								</div>
							</div>
						{/snippet}
					</Card>
				</div>

				<div class="form-section">
					<Card title="Online Booking">
						{#snippet children()}
							<div class="form-group">
								<FormCheckbox
									label="Enable online booking"
									bind:checked={bookingSettings.online_booking_enabled}
								/>

								{#if bookingSettings.online_booking_enabled}
									<FormSelect
										label="Booking Platform"
										bind:value={bookingSettings.booking_platform}
										options={bookingPlatforms}
										placeholder="Select platform"
									/>

									<FormSelect
										label="Calendar Integration"
										bind:value={bookingSettings.calendar_integration}
										options={calendarIntegrations}
										placeholder="Select calendar"
									/>

									<FormSelect
										label="Availability Display"
										bind:value={bookingSettings.availability_display}
										options={availabilityOptions}
									/>
								{/if}

								<FormTextarea
									label="Booking Instructions"
									bind:value={bookingSettings.booking_instructions}
									placeholder="Special instructions for clients when booking..."
									rows={3}
								/>
							</div>
						{/snippet}
					</Card>
				</div>
			</div>

			{#if bookingSettings.online_booking_enabled}
				<Card title="Appointment Types">
					{#snippet children()}
						<div class="form-group">
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-lg font-medium text-gray-900">Available Appointment Types</h3>
								<button type="button" onclick={addAppointmentType} class="button-secondary">
									Add Type
								</button>
							</div>

							{#each bookingSettings.appointment_types as appointmentType, index}
								<div class="mb-4 rounded-lg border p-4">
									<div class="mb-4 flex items-start justify-between">
										<FormField
											label="Appointment Name"
											bind:value={appointmentType.name}
											placeholder="Consultation, Service, etc."
											class="flex-1"
										/>
										{#if bookingSettings.appointment_types.length > 1}
											<button
												type="button"
												onclick={handleRemoveAppointmentType(index)}
												class="ml-4 rounded px-3 py-1 text-red-600 hover:text-red-800"
											>
												Remove
											</button>
										{/if}
									</div>

									<div class="form-row">
										<FormField
											label="Duration (minutes)"
											type="number"
											bind:value={appointmentType.duration}
											placeholder="60"
										/>
									</div>

									<FormTextarea
										label="Description"
										bind:value={appointmentType.description}
										placeholder="Brief description of this appointment type"
										rows={2}
									/>
								</div>
							{/each}
						</div>
					{/snippet}
				</Card>
			{/if}

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Booking Settings"}
				</button>
			</div>
		</form>
	{/if}
</div>
