<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import Button from "$lib/components/ui/button/button.svelte";

	let loading = $state(true);
	let saving = $state(false);

	// Company information form
	let companyForm = $state({
		// Basic Information
		name: "",
		tagline: "",
		description: "",
		industry: "",

		// Contact Information
		email: "",
		phone: "",
		website: "",

		// Address
		address: "",
		city: "",
		state: "",
		zipCode: "",
		country: "United States",

		// Business Hours
		timezone: "America/New_York",
		businessHours: [
			{ day: "Monday", open: "09:00", close: "17:00", isOpen: true },
			{ day: "Tuesday", open: "09:00", close: "17:00", isOpen: true },
			{ day: "Wednesday", open: "09:00", close: "17:00", isOpen: true },
			{ day: "Thursday", open: "09:00", close: "17:00", isOpen: true },
			{ day: "Friday", open: "09:00", close: "17:00", isOpen: true },
			{ day: "Saturday", open: "10:00", close: "16:00", isOpen: false },
			{ day: "Sunday", open: "10:00", close: "16:00", isOpen: false },
		],

		// Social Media
		socialMedia: {
			facebook: "",
			instagram: "",
			twitter: "",
			linkedin: "",
			youtube: "",
			tiktok: "",
		},

		// Business Settings
		acceptsOnlineBooking: true,
		requiresConfirmation: false,
		cancellationPolicy: "",
		paymentMethods: [],
		languages: ["English"],
	});

	const industries = [
		"Hair Salon",
		"Barbershop",
		"Beauty Salon",
		"Spa & Wellness",
		"Nail Salon",
		"Massage Therapy",
		"Legal Services",
		"Accounting",
		"Consulting",
		"Real Estate",
		"Photography",
		"Personal Training",
		"Tutoring",
		"Pet Grooming",
		"Auto Services",
		"Home Services",
		"Healthcare",
		"Dental",
		"Other",
	];

	const timezones = [
		"America/New_York",
		"America/Chicago",
		"America/Denver",
		"America/Los_Angeles",
		"America/Phoenix",
		"America/Anchorage",
		"Pacific/Honolulu",
	];

	const paymentMethodOptions = [
		"Cash",
		"Credit Card",
		"Debit Card",
		"PayPal",
		"Venmo",
		"Apple Pay",
		"Google Pay",
		"Check",
		"Bank Transfer",
	];

	const languageOptions = [
		"English",
		"Spanish",
		"French",
		"German",
		"Italian",
		"Portuguese",
		"Chinese",
		"Japanese",
		"Korean",
		"Arabic",
		"Hindi",
		"Russian",
	];

	onMount(async () => {
		await loadCompanyData();
	});

	async function loadCompanyData() {
		loading = true;
		try {
			const response = await fetch("/api/company");
			if (response.ok) {
				const data = await response.json();
				if (data.company) {
					// Parse JSON fields and merge with form defaults
					const company = data.company;
					if (company.businessHours) {
						company.businessHours = JSON.parse(company.businessHours);
					}
					if (company.socialMedia) {
						company.socialMedia = JSON.parse(company.socialMedia);
					}
					if (company.paymentMethods) {
						company.paymentMethods = JSON.parse(company.paymentMethods);
					}
					if (company.languages) {
						company.languages = JSON.parse(company.languages);
					}
					companyForm = { ...companyForm, ...company };
				}
			}
		} catch (error) {
			console.error("Error loading company data:", error);
			toast.error("Failed to load company information");
		} finally {
			loading = false;
		}
	}

	async function saveCompanyData() {
		saving = true;
		try {
			const response = await fetch("/api/company", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(companyForm),
			});

			if (response.ok) {
				toast.success("Company information saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save company information");
			}
		} catch (error) {
			console.error("Error saving company data:", error);
			toast.error("Failed to save company information");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveCompanyData();
	}

	function togglePaymentMethod(method) {
		if (companyForm.paymentMethods.includes(method)) {
			companyForm.paymentMethods = companyForm.paymentMethods.filter((m) => m !== method);
		} else {
			companyForm.paymentMethods = [...companyForm.paymentMethods, method];
		}
	}

	function toggleLanguage(language) {
		if (companyForm.languages.includes(language)) {
			companyForm.languages = companyForm.languages.filter((l) => l !== language);
		} else {
			companyForm.languages = [...companyForm.languages, language];
		}
	}
</script>

<div class="p-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Company Information</h1>
		<p class="mt-2 text-gray-600">
			Manage your business details, contact information, and settings
		</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Two Column Layout -->
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Left Column -->
				<div class="space-y-6">
					<!-- Basic Information -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
						<div class="space-y-4">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Business Name</label>
								<input
									type="text"
									bind:value={companyForm.name}
									required
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Your Business Name"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Tagline</label>
								<input
									type="text"
									bind:value={companyForm.tagline}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="A short, catchy tagline"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Industry</label>
								<select
									bind:value={companyForm.industry}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">Select Industry</option>
									{#each industries as industry}
										<option value={industry}>{industry}</option>
									{/each}
								</select>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
								<textarea
									bind:value={companyForm.description}
									rows="3"
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Describe your business and services..."
								></textarea>
							</div>
						</div>
					</div>

					<!-- Contact Information -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Contact Information</h2>
						<div class="space-y-4">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
								<input
									type="email"
									bind:value={companyForm.email}
									required
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="business@example.com"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Phone</label>
								<input
									type="tel"
									bind:value={companyForm.phone}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="(555) 123-4567"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Website</label>
								<input
									type="url"
									bind:value={companyForm.website}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="https://www.yourbusiness.com"
								/>
							</div>
						</div>
					</div>

					<!-- Business Address -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Business Address</h2>
						<div class="space-y-4">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Street Address</label>
								<input
									type="text"
									bind:value={companyForm.address}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="123 Main Street"
								/>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700">City</label>
									<input
										type="text"
										bind:value={companyForm.city}
										class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="City"
									/>
								</div>

								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700">State</label>
									<input
										type="text"
										bind:value={companyForm.state}
										class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="State"
									/>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700">ZIP Code</label>
									<input
										type="text"
										bind:value={companyForm.zipCode}
										class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="12345"
									/>
								</div>

								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700">Country</label>
									<input
										type="text"
										bind:value={companyForm.country}
										class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="United States"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Right Column -->
				<div class="space-y-6">
					<!-- Business Hours -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Business Hours</h2>

						<div class="mb-4">
							<label class="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
							<select
								bind:value={companyForm.timezone}
								class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{#each timezones as timezone}
									<option value={timezone}>{timezone.replace("_", " ")}</option>
								{/each}
							</select>
						</div>

						<div class="space-y-2">
							{#each companyForm.businessHours as day}
								<div class="flex items-center gap-3">
									<div class="w-20">
										<input
											type="checkbox"
											bind:checked={day.isOpen}
											id="day-{day.day}"
											class="mr-2"
										/>
										<label for="day-{day.day}" class="text-xs font-medium text-gray-700">
											{day.day.slice(0, 3)}
										</label>
									</div>

									{#if day.isOpen}
										<div class="flex items-center gap-2">
											<input
												type="time"
												bind:value={day.open}
												class="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
											<span class="text-xs text-gray-500">to</span>
											<input
												type="time"
												bind:value={day.close}
												class="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									{:else}
										<div class="text-xs text-gray-400">Closed</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Social Media -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Social Media</h2>
						<div class="space-y-4">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Facebook</label>
								<input
									type="url"
									bind:value={companyForm.socialMedia.facebook}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="https://facebook.com/yourbusiness"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Instagram</label>
								<input
									type="url"
									bind:value={companyForm.socialMedia.instagram}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="https://instagram.com/yourbusiness"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">LinkedIn</label>
								<input
									type="url"
									bind:value={companyForm.socialMedia.linkedin}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="https://linkedin.com/company/yourbusiness"
								/>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Other Links</label>
								<div class="grid grid-cols-2 gap-2">
									<input
										type="url"
										bind:value={companyForm.socialMedia.twitter}
										class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Twitter/X"
									/>
									<input
										type="url"
										bind:value={companyForm.socialMedia.youtube}
										class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="YouTube"
									/>
								</div>
							</div>
						</div>
					</div>

					<!-- Business Settings -->
					<div class="rounded-lg border bg-white p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Business Settings</h2>

						<div class="space-y-4">
							<!-- Booking Settings -->
							<div>
								<h3 class="mb-2 text-sm font-medium text-gray-900">Booking Options</h3>
								<div class="space-y-2">
									<div class="flex items-center">
										<input
											type="checkbox"
											bind:checked={companyForm.acceptsOnlineBooking}
											id="acceptsOnlineBooking"
											class="mr-2"
										/>
										<label for="acceptsOnlineBooking" class="text-sm text-gray-700">
											Accept online bookings
										</label>
									</div>

									<div class="flex items-center">
										<input
											type="checkbox"
											bind:checked={companyForm.requiresConfirmation}
											id="requiresConfirmation"
											class="mr-2"
										/>
										<label for="requiresConfirmation" class="text-sm text-gray-700">
											Require confirmation for bookings
										</label>
									</div>
								</div>
							</div>

							<!-- Payment Methods -->
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700">Payment Methods</label>
								<div class="grid grid-cols-2 gap-1 text-xs">
									{#each paymentMethodOptions as method}
										<div class="flex items-center">
											<input
												type="checkbox"
												checked={companyForm.paymentMethods.includes(method)}
												onchange={(e) => {
													if (e.target.checked) {
														companyForm.paymentMethods = [...companyForm.paymentMethods, method];
													} else {
														companyForm.paymentMethods = companyForm.paymentMethods.filter(
															(m) => m !== method
														);
													}
												}}
												id="payment-{method}"
												class="mr-1"
											/>
											<label for="payment-{method}" class="text-xs text-gray-700">
												{method}
											</label>
										</div>
									{/each}
								</div>
							</div>

							<!-- Languages -->
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700">Languages Spoken</label>
								<div class="grid grid-cols-2 gap-1 text-xs">
									{#each languageOptions.slice(0, 8) as language}
										<div class="flex items-center">
											<input
												type="checkbox"
												checked={companyForm.languages.includes(language)}
												onchange={(e) => {
													if (e.target.checked) {
														companyForm.languages = [...companyForm.languages, language];
													} else {
														companyForm.languages = companyForm.languages.filter(
															(l) => l !== language
														);
													}
												}}
												id="language-{language}"
												class="mr-1"
											/>
											<label for="language-{language}" class="text-xs text-gray-700">
												{language}
											</label>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Full Width Sections -->
			<div class="space-y-6">
				<!-- Cancellation Policy -->
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Cancellation Policy</h2>
					<textarea
						bind:value={companyForm.cancellationPolicy}
						rows="3"
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Describe your cancellation and rescheduling policy..."
					></textarea>
				</div>

				<!-- Save Button -->
				<div class="flex justify-end">
					<Button type="submit" disabled={saving} class="bg-blue-600 hover:bg-blue-700">
						{saving ? "Saving..." : "Save Company Information"}
					</Button>
				</div>
			</div>
		</form>
	{/if}
</div>
