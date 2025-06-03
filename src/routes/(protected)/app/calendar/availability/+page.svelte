<script lang="ts">
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { toast } from "$lib/utils/toast";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data, form } = $props();

	// Reactive data using $derived
	let templates = $derived(data.templates || []);

	// Handle form results
	$effect(() => {
		if (form?.success) {
			toast.success(form.message || "Operation completed successfully");
		} else if (form?.error) {
			toast.error(form.error || "An error occurred");
		}
	});

	// Days of the week mapping
	const daysOfWeek = {
		0: "Sunday",
		1: "Monday",
		2: "Tuesday",
		3: "Wednesday",
		4: "Thursday",
		5: "Friday",
		6: "Saturday",
	};

	function formatTime(timeString) {
		// Convert 24-hour format to 12-hour format
		const [hours, minutes] = timeString.split(":");
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? "PM" : "AM";
		const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
		return `${displayHour.toString().padStart(2, "0")}:${minutes}`;
	}

	function getTemplateSlotsByDay(template) {
		const slotsByDay = {};

		// Initialize all days
		for (let i = 0; i <= 6; i++) {
			slotsByDay[i] = [];
		}

		// Group slots by day
		if (template.slots) {
			template.slots.forEach((slot) => {
				slotsByDay[slot.dayOfWeek].push(slot);
			});
		}

		return slotsByDay;
	}

	function getActiveWeekdays(template) {
		const slotsByDay = getTemplateSlotsByDay(template);
		const activeDays = [];

		// Check Monday through Friday (1-5)
		for (let i = 1; i <= 5; i++) {
			if (slotsByDay[i].length > 0) {
				activeDays.push({
					day: daysOfWeek[i],
					slots: slotsByDay[i],
				});
			}
		}

		// Check weekend (0, 6)
		for (let i of [6, 0]) {
			if (slotsByDay[i].length > 0) {
				activeDays.push({
					day: daysOfWeek[i],
					slots: slotsByDay[i],
				});
			}
		}

		return activeDays;
	}

	function getTotalSlots(template) {
		return template.slots ? template.slots.length : 0;
	}

	async function deleteTemplate(template) {
		try {
			const formData = new FormData();
			formData.append("id", template.id);

			const response = await fetch("?/delete", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				await invalidateAll();
				// No need for toast here - the service will send notifications
			} else {
				// Only show error toast if the request itself failed
				toast.error("Failed to delete template");
			}
		} catch (error) {
			console.error("Error deleting template:", error);
			toast.error("Failed to delete template");
		}
	}

	function handleDeleteTemplate(template) {
		return () => deleteTemplate(template);
	}
</script>

<svelte:head>
	<title>Availability Templates | Calendar</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-gray-900">Availability Templates</h2>
			<p class="text-gray-600">
				Create reusable availability schedules like "Office Hours" or "Weekend Availability"
			</p>
		</div>
		<a href="/app/calendar/availability/new">
			<Button class="bg-blue-600 hover:bg-blue-700">Create Template</Button>
		</a>
	</div>

	<!-- Templates Grid -->
	{#if templates.length === 0}
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
			<p class="mt-2 text-gray-500">Create your first availability template to get started</p>
			<a href="/app/calendar/availability/new">
				<Button class="mt-4 bg-blue-600 hover:bg-blue-700">Create Template</Button>
			</a>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each templates as template}
				<div class="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex-1">
							<div class="mb-2 flex items-center gap-2">
								<h3 class="text-lg font-semibold text-gray-900">{template.name}</h3>
								{#if template.isDefault}
									<span
										class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
									>
										Default
									</span>
								{/if}
							</div>
							{#if template.description}
								<p class="mb-3 text-sm text-gray-600">{template.description}</p>
							{/if}
							<p class="mb-4 text-sm text-gray-500">{getTotalSlots(template)} time slots</p>
						</div>
						<div class="flex flex-shrink-0 items-center gap-1">
							<a href="/app/calendar/availability/{template.id}">
								<button
									class="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
							</a>
							{#if !template.isDefault}
								<button
									onclick={handleDeleteTemplate(template)}
									class="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
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

					<!-- Time slots display -->
					<div class="space-y-2">
						{#each getActiveWeekdays(template) as { day, slots }}
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">{day}</span>
								<div class="text-right">
									{#each slots as slot, index}
										<div class="text-gray-900">
											{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
										</div>
									{/each}
								</div>
							</div>
						{/each}

						{#if getTotalSlots(template) === 0}
							<div class="text-sm italic text-gray-500">No time slots configured</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Information Section -->
	<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
		<div class="flex">
			<div class="flex-shrink-0">
				<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					></path>
				</svg>
			</div>
			<div class="ml-3">
				<h3 class="text-sm font-medium text-blue-800">Availability Templates</h3>
				<div class="mt-2 text-sm text-blue-700">
					<ul class="list-inside list-disc space-y-1">
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
