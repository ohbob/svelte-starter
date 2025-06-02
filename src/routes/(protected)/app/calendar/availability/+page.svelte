<script lang="ts">
	import { enhance } from "$app/forms";
	import { toast } from "$lib/utils/toast";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data, form } = $props();

	// State
	let availabilityTemplates = $state([]);
	let showTemplateForm = $state(false);
	let editingTemplate = $state(null);

	// Template form
	let templateForm = $state({
		name: "",
		description: "",
		isDefault: false,
		slots: [
			{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true },
			{ dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true },
			{ dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true },
			{ dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true },
			{ dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true },
			{ dayOfWeek: 6, startTime: "09:00", endTime: "17:00", enabled: false },
			{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00", enabled: false },
		],
	});

	const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	// Data sync
	$effect(() => {
		availabilityTemplates = data.availabilityTemplates || [];
	});

	// Handle form results
	$effect(() => {
		if (form?.success) {
			toast.success(form.message || "Operation completed successfully");
			showTemplateForm = false;
			resetTemplateForm();
		} else if (form?.error) {
			toast.error(form.error || "An error occurred");
		}
	});

	function resetTemplateForm() {
		editingTemplate = null;
		templateForm = {
			name: "",
			description: "",
			isDefault: false,
			slots: [
				{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true },
				{ dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true },
				{ dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true },
				{ dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true },
				{ dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true },
				{ dayOfWeek: 6, startTime: "09:00", endTime: "17:00", enabled: false },
				{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00", enabled: false },
			],
		};
	}

	function editTemplate(template) {
		editingTemplate = template;
		templateForm = {
			name: template.name,
			description: template.description || "",
			isDefault: template.isDefault,
			slots: [
				{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: false },
				{ dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: false },
				{ dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: false },
				{ dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: false },
				{ dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: false },
				{ dayOfWeek: 6, startTime: "09:00", endTime: "17:00", enabled: false },
				{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00", enabled: false },
			],
		};

		// Apply template slots to form
		template.slots.forEach((slot) => {
			const formSlot = templateForm.slots.find((s) => s.dayOfWeek === slot.dayOfWeek);
			if (formSlot) {
				formSlot.startTime = slot.startTime;
				formSlot.endTime = slot.endTime;
				formSlot.enabled = true;
			}
		});

		showTemplateForm = true;
	}

	function deleteTemplate(template) {
		if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
			const form = document.createElement("form");
			form.method = "POST";
			form.action = "?/deleteTemplate";
			form.style.display = "none";

			const input = document.createElement("input");
			input.type = "hidden";
			input.name = "templateId";
			input.value = template.id;
			form.appendChild(input);

			document.body.appendChild(form);
			form.submit();
			document.body.removeChild(form);
		}
	}

	function openForm() {
		showTemplateForm = true;
	}

	function closeForm() {
		showTemplateForm = false;
		resetTemplateForm();
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-gray-900">Availability Templates</h2>
			<p class="text-gray-600">
				Create reusable availability schedules like "Office Hours" or "Weekend Availability"
			</p>
		</div>
		<Button onclick={openForm} class="bg-blue-600 hover:bg-blue-700">Create Template</Button>
	</div>

	<!-- Availability Templates -->
	{#if availabilityTemplates.length === 0}
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
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<h3 class="text-lg font-medium text-gray-900">No availability templates yet</h3>
			<p class="mt-2 text-gray-500">
				Create your first availability template to organize your schedule
			</p>
			<Button onclick={openForm} class="mt-4 bg-blue-600 hover:bg-blue-700">Create Template</Button>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each availabilityTemplates as template}
				<div class="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<h3 class="font-semibold text-gray-900">{template.name}</h3>
								{#if template.isDefault}
									<span
										class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
									>
										Default
									</span>
								{/if}
							</div>
							{#if template.description}
								<p class="mt-1 text-sm text-gray-500">{template.description}</p>
							{/if}
							<p class="mt-1 text-xs text-gray-400">{template.slots.length} time slots</p>
						</div>
						<div class="flex items-center gap-2">
							<button
								onclick={() => editTemplate(template)}
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
								aria-label="Edit template"
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
							{#if !template.isDefault}
								<button
									onclick={() => deleteTemplate(template)}
									class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
									aria-label="Delete template"
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
							{/if}
						</div>
					</div>

					<div class="space-y-2">
						{#each template.slots as slot}
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600">{dayNames[slot.dayOfWeek]}</span>
								<span class="font-medium text-gray-900">{slot.startTime} - {slot.endTime}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Tips -->
	<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
		<div class="flex">
			<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
					clip-rule="evenodd"
				></path>
			</svg>
			<div class="ml-3">
				<h3 class="text-sm font-medium text-blue-800">Availability Templates</h3>
				<div class="mt-2 text-sm text-blue-700">
					<ul class="list-disc space-y-1 pl-5">
						<li>
							Create named schedules like "Office Hours", "Weekend Availability", or "Consultation
							Hours"
						</li>
						<li>Assign templates to specific meeting types for flexible scheduling</li>
						<li>Set one template as default for new meeting types</li>
						<li>Templates are specific to this company</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Template Form Modal -->
{#if showTemplateForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-lg rounded-lg bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">
				{editingTemplate ? "Edit Availability Template" : "Create Availability Template"}
			</h3>

			<form
				method="POST"
				action={editingTemplate ? "?/updateTemplate" : "?/createTemplate"}
				use:enhance
				class="space-y-4"
			>
				{#if editingTemplate}
					<input type="hidden" name="templateId" value={editingTemplate.id} />
				{/if}

				<div>
					<label for="templateName" class="mb-1 block text-sm font-medium text-gray-700"
						>Template Name</label
					>
					<input
						type="text"
						id="templateName"
						name="name"
						bind:value={templateForm.name}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Office Hours"
					/>
				</div>

				<div>
					<label for="templateDescription" class="mb-1 block text-sm font-medium text-gray-700"
						>Description (optional)</label
					>
					<textarea
						id="templateDescription"
						name="description"
						bind:value={templateForm.description}
						rows="2"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Standard business hours for client meetings"
					></textarea>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						name="isDefault"
						bind:checked={templateForm.isDefault}
						id="isDefault"
						class="mr-2"
					/>
					<label for="isDefault" class="text-sm text-gray-700">
						Set as default template for new meeting types
					</label>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">Availability Schedule</label>
					<input
						type="hidden"
						name="slots"
						value={JSON.stringify(
							templateForm.slots
								.filter((slot) => slot.enabled)
								.map((slot) => ({
									dayOfWeek: slot.dayOfWeek,
									startTime: slot.startTime,
									endTime: slot.endTime,
								}))
						)}
					/>

					{#each templateForm.slots as slot}
						<div class="flex items-center gap-4 py-2">
							<div class="w-20">
								<input
									type="checkbox"
									bind:checked={slot.enabled}
									id="day-{slot.dayOfWeek}"
									class="mr-2"
								/>
								<label for="day-{slot.dayOfWeek}" class="text-sm font-medium text-gray-700">
									{dayNames[slot.dayOfWeek].slice(0, 3)}
								</label>
							</div>

							{#if slot.enabled}
								<div class="flex flex-1 items-center gap-2">
									<input
										type="time"
										bind:value={slot.startTime}
										class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<span class="text-gray-500">to</span>
									<input
										type="time"
										bind:value={slot.endTime}
										class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							{:else}
								<div class="flex-1 text-sm text-gray-400">Unavailable</div>
							{/if}
						</div>
					{/each}
				</div>

				<div class="flex justify-end gap-3 pt-4">
					<Button type="button" variant="outline" onclick={closeForm}>Cancel</Button>
					<Button type="submit" class="bg-blue-600 hover:bg-blue-700">
						{editingTemplate ? "Update Template" : "Create Template"}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
