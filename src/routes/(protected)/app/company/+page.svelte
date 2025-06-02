<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import {
		Button,
		FormField,
		FormTextarea,
		FormSelect,
		Card,
		LoadingSpinner,
		BusinessHours,
		FormCheckbox,
	} from "$lib/components/ui";
	import {
		INDUSTRIES,
		TIMEZONES,
		PAYMENT_METHODS,
		LANGUAGES,
		DEFAULT_BUSINESS_HOURS,
	} from "$lib/utils/form";

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
		businessHours: DEFAULT_BUSINESS_HOURS,

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

	onMount(() => {
		// Redirect to business-info since we removed the main company tab
		goto("/app/company/business-info", { replaceState: true });
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
</script>

<div class="flex min-h-64 items-center justify-center">
	<div class="text-center">
		<div class="text-lg text-gray-600">Redirecting to Business Info...</div>
	</div>
</div>
