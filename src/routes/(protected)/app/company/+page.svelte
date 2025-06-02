<script>
	import { Button } from "$lib/components/ui/button";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { browser } from "$app/environment";
	import EditableCard from "$lib/components/ui/editable-card.svelte";

	let { data, form } = $props();

	// Individual field states for debounced saving
	let fields = $state({
		name: { value: data.currentCompany?.name || "", saving: false, lastSaved: null },
		slug: { value: data.currentCompany?.slug || "", saving: false, lastSaved: null },
		slugInput: data.currentCompany?.slug || "", // Separate input value for natural typing
		email: { value: data.currentCompany?.email || "", saving: false, lastSaved: null },
		phone: { value: data.currentCompany?.phone || "", saving: false, lastSaved: null },
		vat: { value: data.currentCompany?.vat || "", saving: false, lastSaved: null },
		regNr: { value: data.currentCompany?.regNr || "", saving: false, lastSaved: null },
		description: { value: data.currentCompany?.description || "", saving: false, lastSaved: null },
	});

	// Debounce timers for each field
	let debounceTimers = {};

	// Auto-save function for individual fields
	const autoSave = async (fieldName, value) => {
		if (!browser || !data.currentCompany?.id) return;

		fields[fieldName].saving = true;

		try {
			const response = await fetch(`/api/companies/${data.currentCompany.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ [fieldName]: value }),
			});

			if (response.ok) {
				fields[fieldName].lastSaved = new Date();
				toast.success(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} updated`);
			} else {
				const error = await response.json();
				toast.error(error.message || "Failed to update");
			}
		} catch (error) {
			toast.error("Failed to update");
		} finally {
			fields[fieldName].saving = false;
		}
	};

	// Debounced input handler
	const handleInput = (fieldName, value) => {
		fields[fieldName].value = value;

		// Clear existing timer
		if (debounceTimers[fieldName]) {
			clearTimeout(debounceTimers[fieldName]);
		}

		// Set new timer
		debounceTimers[fieldName] = setTimeout(() => {
			autoSave(fieldName, value);
		}, 1000); // 1 second debounce
	};

	// Generate slug from name
	const generateSlug = (name) => {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
	};

	// Handle name change to auto-generate slug
	const handleNameChange = (value) => {
		if (value && !fields.slug.value) {
			const newSlug = generateSlug(value);
			fields.slug.value = newSlug;
			fields.slugInput = newSlug;
		}
	};

	// Reactive statement to convert slug input to proper slug format
	$effect(() => {
		if (fields.slugInput !== undefined) {
			const formatted = fields.slugInput
				.toLowerCase()
				.replace(/[^a-z0-9-\s]/g, "")
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-+|-+$/g, "");

			if (formatted !== fields.slug.value) {
				fields.slug.value = formatted;
			}
		}
	});

	// Icons for each field
	const icons = {
		building:
			'<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
		link: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>',
		email:
			'<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
		phone:
			'<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>',
		calculator:
			'<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>',
		document:
			'<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
		text: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>',
	};
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Company Settings</h1>
		<p class="mt-1 text-sm text-gray-600">
			Manage your company information. Changes are saved automatically.
		</p>
	</div>

	<!-- Company Information Cards -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Company Name -->
		<EditableCard
			label="Company Name"
			bind:value={fields.name.value}
			bind:saving={fields.name.saving}
			bind:lastSaved={fields.name.lastSaved}
			placeholder="Enter company name"
			icon={icons.building}
			iconColor="blue"
			companyId={data.currentCompany?.id}
			fieldName="name"
			onInput={handleNameChange}
		/>

		<!-- Company URL -->
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center justify-between">
				<div class="flex-1">
					<div class="text-sm font-medium text-gray-500">Company URL</div>
					<input
						type="text"
						bind:value={fields.slugInput}
						placeholder="company-url"
						class="w-full border-none bg-transparent p-0 text-lg font-semibold text-gray-900 placeholder-gray-400 outline-none focus:ring-0"
					/>
					<div class="mt-1 text-xs text-gray-500">
						{#if fields.slug.value}
							<a
								href="/c/{fields.slug.value}"
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:text-blue-800 hover:underline"
							>
								yoursite.com/c/{fields.slug.value}
							</a>
						{:else}
							yoursite.com/c/company-url
						{/if}
					</div>
					{#if fields.slug.saving}
						<div class="text-xs text-blue-600">Saving...</div>
					{:else if fields.slug.lastSaved}
						<div class="text-xs text-green-600">✓ Saved</div>
					{/if}
				</div>
				<div class="ml-4 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
					<span class="text-green-600">{@html icons.link}</span>
				</div>
			</div>
		</div>

		<!-- Email -->
		<EditableCard
			label="Email Address"
			bind:value={fields.email.value}
			bind:saving={fields.email.saving}
			bind:lastSaved={fields.email.lastSaved}
			type="email"
			placeholder="contact@company.com"
			icon={icons.email}
			iconColor="purple"
			companyId={data.currentCompany?.id}
			fieldName="email"
		/>

		<!-- Phone -->
		<EditableCard
			label="Phone Number"
			bind:value={fields.phone.value}
			bind:saving={fields.phone.saving}
			bind:lastSaved={fields.phone.lastSaved}
			type="tel"
			placeholder="+1 (555) 123-4567"
			icon={icons.phone}
			iconColor="orange"
			companyId={data.currentCompany?.id}
			fieldName="phone"
		/>

		<!-- VAT Number -->
		<EditableCard
			label="VAT Number"
			bind:value={fields.vat.value}
			bind:saving={fields.vat.saving}
			bind:lastSaved={fields.vat.lastSaved}
			placeholder="VAT123456789"
			icon={icons.calculator}
			iconColor="red"
			companyId={data.currentCompany?.id}
			fieldName="vat"
		/>

		<!-- Registration Number -->
		<EditableCard
			label="Registration Number"
			bind:value={fields.regNr.value}
			bind:saving={fields.regNr.saving}
			bind:lastSaved={fields.regNr.lastSaved}
			placeholder="REG123456789"
			icon={icons.document}
			iconColor="indigo"
			companyId={data.currentCompany?.id}
			fieldName="regNr"
		/>
	</div>

	<!-- Description Card (Full Width) -->
	<EditableCard
		label="Company Description"
		bind:value={fields.description.value}
		bind:saving={fields.description.saving}
		bind:lastSaved={fields.description.lastSaved}
		placeholder="Tell people about your company..."
		rows={4}
		icon={icons.text}
		iconColor="gray"
		companyId={data.currentCompany?.id}
		fieldName="description"
	/>
</div>
